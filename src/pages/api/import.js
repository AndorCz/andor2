import { createThread, getStoryteller } from '@lib/openai'

async function migrateOldCharacter (newGameId, newGameGmId, character, locals, isGm, isAlive) {
  if (isGm) {
    // character is GM - do not create new one, just update existing
    await locals.supabase
      .from('characters')
      .update({ name: character.char_name })
      .eq('id', newGameGmId)
    await importPortrait(newGameGmId, character.id_char, locals, false)
    return
  }

  let alive = 'alive'
  if (!isAlive) {
    alive = 'dead'
  }

  const { data: newCharData } = await locals.supabase.from('characters').insert({
    player: locals.user.id,
    game: newGameId,
    name: character.char_name,
    bio: character.char_desc,
    storyteller_notes: character.gm_notes,
    state: alive,
    accepted: true
  }).select().single()

  await importPortrait(newCharData.id, character.id_char, locals, false)
  return newCharData.id
}

async function migrateOldPosts (oldGameId, newGameThread, idMap, locals) {
  const { data: oldPosts } = await locals.supabase
    .from('old_posts')
    .select('*')
    .eq('game_id', oldGameId)

  const postsToInsert = []
  for (const post of oldPosts) {
    let toChars = null
    if (post.to_chars) {
      toChars = null
    }

    if (post.to_chars === '') {
      toChars = null
    } else {
      const ids = post.to_chars.split(',').map(id => id.trim())
      const convertedIds = ids.map(id => idMap[id] || null)
      const filteredIds = convertedIds.filter(id => id !== null)

      toChars = filteredIds.length > 0 ? filteredIds : null
    }
    const postToInsert = {
      thread: newGameThread,
      owner: idMap[post.id_from],
      owner_type: 'character',
      content: post.content,
      created_at: post.post_date,
      audience: toChars
    }
    postsToInsert.push(postToInsert)
  }
  const batchSize = 1000
  for (let i = 0; i < postsToInsert.length; i += batchSize) {
    const batch = postsToInsert.slice(i, i + batchSize)
    await locals.supabase.from('posts').insert(batch)
  }

  // Everything good
  await locals.supabase
    .from('old_games')
    .update({ migrating: false, migrated: true })
    .eq('id_game', oldGameId)
}

async function createGame (locals, oldGameData) {
  // create new game
  const openAiThread = await createThread()
  const openAiStoryteller = await getStoryteller('base')
  // eslint-disable-next-line no-unused-vars
  const { data, error } = await locals.supabase.from('games').insert({
    owner: locals.user.id,
    name: oldGameData.game_name,
    openai_thread: openAiThread,
    openai_storyteller: openAiStoryteller,
    created_at: oldGameData.created_at,
    annotation: oldGameData.game_name
  }).select().single()

  // add bookmark
  await locals.supabase.from('bookmarks').upsert({ user_id: locals.user.id, game_id: data.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })

  // get GM id
  const { data: gmData, error: gmError } = await locals.supabase
    .from('characters')
    .select('id')
    .eq('game', data.id)
    .eq('storyteller', true)
    .single()

  // insert game description as first post
  if (!gmError && gmData) {
    await locals.supabase.from('posts').insert({
      owner: gmData.id,
      owner_type: 'character',
      content: oldGameData.game_desc,
      thread: data.game_thread,
      created_at: oldGameData.created_at
    }).select().single()
  }

  const newGameId = data.id
  const newGameGmId = gmData.id
  const newGameThread = data.game_thread

  // Get every characters that have at least one post in game
  const { data: oldCharData } = await locals.supabase
    .rpc('get_old_chars_by_game', { game_id_param: oldGameData.id_game })

  const idMap = {}

  for (const character of oldCharData) {
    if (character.game_id === oldGameData.id_game) {
      // Char alive
      if (character.gm_id === 1) {
        await migrateOldCharacter(newGameId, newGameGmId, character, locals, true, true)
        idMap[character.id_char] = newGameGmId
      } else {
        idMap[character.id_char] = await migrateOldCharacter(newGameId, newGameGmId, character, locals, false, true)
      }
    } else {
      // Char is dead
      idMap[character.id_char] = await migrateOldCharacter(newGameId, newGameGmId, character, locals, false, false)
    }
  }

  // Todo: Import icons for those characters

  // migrate posts
  await migrateOldPosts(oldGameData.id_game, newGameThread, idMap, locals)
}

async function migrateGame (gameId, locals) {
  // Check if work belong to user
  const { data: gameData, error: gameError } = await locals.supabase
    .from('old_games')
    .select('*')
    .eq('id_game', parseInt(gameId, 10))
    .eq('gm_id', parseInt(locals.user.old_id, 10))
    .eq('migrated', false)
    .eq('migrating', false)
    .maybeSingle()
  if (gameError) { return new Response(JSON.stringify({ error: gameError.message }), { status: 500 }) }
  if (!gameData) { return new Response(JSON.stringify({ error: 'Hra nenalezena - nesprávný uživatel nebo probíha migrace' }), { status: 404 }) }

  // we know game is ready to be migrated - update status, as this might take some time
  await locals.supabase
    .from('old_games')
    .update({ migrating: true })
    .eq('id_game', gameId)

  createGame(locals, gameData)

  // start process but do not wait
  return new Response(JSON.stringify({ status: 202 }))
}

async function migrateWork (workId, locals) {
  // Check if work belong to user
  const { data: workData, error: workError } = await locals.supabase
    .from('old_works')
    .select('*')
    .eq('id', workId)
    .eq('owner', locals.user.old_id)
    .eq('migrated', false)
    .maybeSingle()

  if (workError) { return new Response(JSON.stringify({ error: workError.message }), { status: 500 }) }
  if (!workData) { return new Response(JSON.stringify({ error: 'Článek nenalezen - nesprávný uživatel nebo už byl zmigrován.' }), { status: 404 }) }

  const { data, error } = await locals.supabase.from('works').insert({
    owner: locals.user.id,
    name: workData.name,
    category: workData.category,
    content: workData.content,
    annotation: workData.annotation,
    tags: workData.tags,
    created_at: workData.post_date
  }).select().single()

  if (error || !data) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: 'Error with db' }), { status: 500 })
  }
  // Update old_works so we know what was migrated
  await locals.supabase
    .from('old_works')
    .update({ migrated: true })
    .eq('id', workId)
  return new Response(JSON.stringify({ status: 200 }))
}

async function migrateChar (charId, locals) {
  // Get char - and make sure it belongs to caller
  const { data: charData, error: charError } = await locals.supabase
    .from('old_chars')
    .select('*')
    .eq('id_user', locals.user.old_id)
    .eq('id_char', charId)
    .eq('migrated', false)
    .maybeSingle()
  if (charError || !charData) {
    return new Response(JSON.stringify({ status: 404 }))
  }

  // Create new char
  const { data: newCharData } = await locals.supabase.from('characters').insert({
    player: locals.user.id,
    name: charData.char_name,
    bio: charData.char_desc,
    storyteller_notes: charData.gm_notes,
    state: 'alive'
  }).select().single()

  // Mark char as migrated
  if (newCharData) {
    await locals.supabase
      .from('old_chars')
      .update({ migrated: true })
      .eq('id_char', charData.id_char)
  }

  await importPortrait(newCharData.id, charData.id_char, locals, false)
  return new Response(JSON.stringify({ status: 200 }))
}

async function importPortrait (newId, oldId, locals, isUser) {
  const newAvatarName = `${newId}.jpg`
  // remove even if does not exists
  await locals.supabase.storage.from('portraits').remove(newAvatarName)

  const avatarName = isUser ? `old_icons_users/user_${oldId}.jpg` : `old_icons_chars/${oldId}.jpg`
  const { data, error } = await locals.supabase.storage.from('portraits').copy(avatarName, newAvatarName)
  if (!data || error) {
    console.log('Portrait not found:', avatarName)
    return false
  }
  if (isUser) {
    await locals.supabase
      .from('profiles')
      .update({ portrait: 'one_walrus_to_rule_them_all' })
      .eq('id', newId)
  } else {
    await locals.supabase
      .from('characters')
      .update({ portrait: 'all_hail_god_emperor_walrus' })
      .eq('id', newId)
  }
  return true
}

async function importUserPortrait (oldId, locals) {
  if (oldId !== locals.user.old_id) {
    return new Response(JSON.stringify({ error: 'Snažíš se stáhnout cizí ikonku, nebo chybí id' }), { status: 500 })
  }
  const profileSet = await importPortrait(locals.user.id, locals.user.old_id, locals, true)
  if (profileSet) {
    return new Response(JSON.stringify({ status: 200 }))
  }
  return new Response(JSON.stringify({ status: 404 }))
}

// Main api handler for migrate functions
export const POST = async ({ request, locals }) => {
  try {
    const { action, gameId, workId, charId, oldId } = await request.json()
    switch (action) {
      case 'migrate_game': return migrateGame(gameId, locals)
      case 'migrate_work': return migrateWork(workId, locals)
      case 'migrate_char': return migrateChar(charId, locals)
      case 'import_user_portrait': return importUserPortrait(oldId, locals)
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}
