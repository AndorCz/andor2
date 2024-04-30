
async function migrateOldCharacter (newGameId, newGameGmId, character, locals, isGm, isAlive) {
  if (isGm) {
    // character is GM - do not create new one, just update existing
    const { data, error } = await locals.supabase.from('characters').update({ name: character.char_name }).eq('id', newGameGmId).select().single()
    if (error) { return error }
    const result = await importPortrait(newGameGmId, character.id_char, locals, false)
    if (result.error) { return result }
    return data
  }

  const { data: newCharData, error: inserError } = await locals.supabase.from('characters').insert({
    player: locals.user.id,
    game: newGameId,
    name: character.char_name,
    bio: character.char_desc,
    storyteller_notes: character.gm_notes,
    state: isAlive ? 'alive' : 'dead',
    accepted: true
  }).select().single()
  if (inserError) { return { error: inserError } }

  const result = await importPortrait(newCharData.id, character.id_char, locals, false)
  if (result.error) { return result }
  return newCharData
}

async function migrateOldPosts (oldGameId, newGameThread, idMap, locals) {
  const { data: oldPosts, error: oldPostError } = await locals.supabase.from('old_posts').select('*').eq('game_id', oldGameId)
  if (oldPostError) { return { error: oldPostError } }

  const postsToInsert = []
  for (const post of oldPosts) {
    let toChars = null
    if (post.to_chars !== '') {
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
    const { error } = await locals.supabase.from('posts').insert(batch)
    if (error) { return { error } }
  }

  // Everything good
  const { error: oldGameError } = await locals.supabase.from('old_games').update({ migrating: false, migrated: true }).eq('id_game', oldGameId)
  if (oldGameError) { return { error: oldGameError } }
}

async function createGame (locals, oldGameData) {
  // create new game
  const { data, error: insertError } = await locals.supabase.from('games').insert({
    owner: locals.user.id,
    name: oldGameData.game_name,
    created_at: oldGameData.created_at,
    annotation: oldGameData.game_name
  }).select().single()
  if (insertError) { return { error: insertError } }

  // add bookmark
  const { error: bookmarkError } = await locals.supabase.from('bookmarks').upsert({ user_id: locals.user.id, game_id: data.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
  if (bookmarkError) { return { error: bookmarkError } }

  // get GM id
  const { data: gmData, error: gmError } = await locals.supabase
    .from('characters')
    .select('id')
    .eq('game', data.id)
    .eq('storyteller', true)
    .single()
  if (gmError) { return { error: gmError } }

  // insert game description as first post
  if (gmData) {
    const { error: postError } = await locals.supabase.from('posts').insert({
      owner: gmData.id,
      owner_type: 'character',
      content: oldGameData.game_desc,
      thread: data.game_thread,
      created_at: oldGameData.created_at
    }).select().single()
    if (postError) { return { postError } }
  } else {
    return { error: 'GM not found' }
  }

  const newGameId = data.id
  const newGameGmId = gmData.id
  const newGameThread = data.game_thread

  // Get every characters that have at least one post in game
  const { data: oldCharData, error: oldCharError } = await locals.supabase
    .rpc('get_old_chars_by_game', { game_id_param: oldGameData.id_game })
  if (oldCharError) { return { error: oldCharError } }

  const idMap = {}

  for (const character of oldCharData) {
    const isAlive = character.game_id === oldGameData.id_game
    const isGm = character.gm_id === 1
    const result = await migrateOldCharacter(newGameId, newGameGmId, character, locals, isGm, isAlive)
    if (result.error) { return { error: result.error } }
    if (isAlive) {
      idMap[character.id_char] = isGm ? newGameGmId : result.id
    } else {
      idMap[character.id_char] = result.id
    }
  }

  // Todo: Import icons for those characters

  // migrate posts
  const result = await migrateOldPosts(oldGameData.id_game, newGameThread, idMap, locals)
  if (result.error) { return result }
}

async function migrateGame (gameId, locals) {
  // Check if the game belongs to the user
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
  const { error: oldGameError } = await locals.supabase.from('old_games').update({ migrating: true }).eq('id_game', gameId)
  if (oldGameError) { return new Response(JSON.stringify({ error: oldGameError.message }), { status: 500 }) }

  const result = await createGame(locals, gameData)
  if (result.error) {
    const { error: finalizeError } = await locals.supabase.from('old_games').update({ migrating: false }).eq('id_game', gameId)
    if (finalizeError) { return new Response(JSON.stringify({ error: finalizeError.message }), { status: 500 }) }
    return new Response(JSON.stringify(result), { status: 500 })
  } else {
    return new Response(JSON.stringify({ status: 202 }))
  }
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
  if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
  if (!data) { return new Response(JSON.stringify({ error: 'Error adding work' }), { status: 500 }) }

  // Update old_works so we know what was migrated
  const { error: oldWorkError } = await locals.supabase.from('old_works').update({ migrated: true }).eq('id', workId)
  if (oldWorkError) { return new Response(JSON.stringify({ error: oldWorkError.message }), { status: 500 }) }
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
  if (charError) { return new Response(JSON.stringify({ error: charError.message }), { status: 500 }) }
  if (!charData) { return new Response(JSON.stringify({ error: 'Error: Failed to add character' }, { status: 404 })) }

  // Create new char
  const { data: newCharData, error: newCharError } = await locals.supabase.from('characters').insert({
    player: locals.user.id,
    name: charData.char_name,
    bio: charData.char_desc,
    storyteller_notes: charData.gm_notes,
    state: 'alive'
  }).select().single()
  if (newCharError) { return new Response(JSON.stringify({ error: newCharError.message }), { status: 500 }) }

  // Mark char as migrated
  if (newCharData) {
    const { error: oldCharError } = await locals.supabase.from('old_chars').update({ migrated: true }).eq('id_char', charData.id_char)
    if (oldCharError) { return new Response(JSON.stringify({ error: oldCharError.message }), { status: 500 }) }
  }

  const result = await importPortrait(newCharData.id, charData.id_char, locals, false)
  if (result.error) { return new Response(JSON.stringify({ error: result.error }), { status: 500 }) }
  return new Response(JSON.stringify({ status: 200 }))
}

async function importPortrait (newId, oldId, locals, isUser) {
  const newAvatarName = `${newId}.jpg`
  // remove even if does not exists
  const { error } = await locals.supabase.storage.from('portraits').remove(newAvatarName)
  if (error) { return error }

  const avatarName = isUser ? `old_icons_users/user_${oldId}.jpg` : `old_icons_chars/${oldId}.jpg`
  const { data, error: copyError } = await locals.supabase.storage.from('portraits').copy(avatarName, newAvatarName)
  if (copyError) { return copyError }
  if (!data) { return { error: 'Portrait not found: ' + avatarName } }

  const { error: hashError } = await locals.supabase.from(isUser ? 'profiles' : 'characters').update({ portrait: 'one_walrus_to_rule_them_all' }).eq('id', newId)
  if (hashError) { return hashError }
  return true
}

async function importUserPortrait (oldId, locals) {
  if (oldId !== locals.user.old_id) {
    return new Response(JSON.stringify({ error: 'Snažíš se stáhnout cizí ikonku, nebo chybí id' }), { status: 500 })
  }
  const profileSet = await importPortrait(locals.user.id, locals.user.old_id, locals, true)
  if (profileSet.error) { return new Response(JSON.stringify({ error: profileSet.error }), { status: 500 }) }
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
