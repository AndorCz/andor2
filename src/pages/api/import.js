async function importAllPosts (oldGameId, newGameThread, idMap, locals) {
  try {
    let pageIndex = 0
    const pageSize = 1000
    let results = []
    let hasMore = true

    while (hasMore) {
      const { data: oldPosts, error } = await locals.supabase
        .from('old_posts')
        .select('*')
        .eq('game_id', oldGameId)
        .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1)
        .order('id_post', { ascending: true })
      if (error) {
        console.error('Failed to fetch data:', error)
        break
      }

      const postsToInsert = oldPosts.map(post => {
        let toChars = null
        if (post.to_chars) {
          const ids = post.to_chars.split(',').map(id => id.trim())
          const convertedIds = ids.map(id => idMap[id] || null).filter(id => id !== null)
          toChars = convertedIds.length > 0 ? convertedIds : null
        }
        return {
          thread: newGameThread,
          owner: idMap[post.id_from],
          owner_type: 'character',
          content: post.content,
          created_at: post.post_date,
          audience: toChars
        }
      })
      const { error: batchInsertError } = await locals.supabase.from('posts').insert(postsToInsert)
      if (batchInsertError) throw new Error(`Failed to insert posts batch: ${batchInsertError.message}`)

      results = results.concat(oldPosts)
      if (!oldPosts || oldPosts.length < pageSize) {
        hasMore = false
      } else {
        pageIndex++
      }
    }

    // Update old game status after migration
    const { error: oldGameError } = await locals.supabase.from('old_games').update({ migrating: false, migrated: true }).eq('id_game', oldGameId)
    if (oldGameError) throw new Error(`Failed to update old game status: ${oldGameError.message}`)

    // Successful migration
    return { status: 'Migration of posts completed successfully' }
  } catch (err) {
    return { error: err.message }
  }
}

async function migrateOldCharacter (newGameId, newGameGmId, character, locals, isGm, isAlive) {
  try {
    if (isGm) {
      // Attempt to update character for GM
      const { data, error } = await locals.supabase.from('characters').update({ name: character.char_name }).eq('id', newGameGmId).select().single()
      if (error) throw new Error(`Failed to update GM character: ${error.message}`)
      const result = await importPortrait(newGameGmId, character.id_char, locals, false)
      if (result.error) console.log('Portrait not updated but do not care')
      return data
    }

    // Handle character creation for players
    const { data: newCharData, error: insertError } = await locals.supabase.from('characters').insert({
      player: locals.user.id,
      game: newGameId,
      name: character.char_name,
      bio: character.char_desc,
      storyteller_notes: character.gm_notes,
      state: isAlive ? 'alive' : 'dead',
      accepted: true
    }).select().single()
    if (insertError) throw new Error(`Failed to insert character: ${insertError.message}`)
    const portraitResult = await importPortrait(newCharData.id, character.id_char, locals, false)
    if (portraitResult.error) console.log('Portrait not updated but do not care')

    return newCharData
  } catch (err) {
    return { error: err.message }
  }
}

async function createGame (locals, oldGameData) {
  try {
    // get Homepage
    const { data: hpData, error: hpError } = await locals.supabase
      .from('old_homepages')
      .select('content')
      .eq('game_id', parseInt(oldGameData.id_game, 10))
      .maybeSingle()

    // Create new game in database
    const { data, error: insertError } = await locals.supabase.from('games').insert({
      owner: locals.user.id,
      name: oldGameData.game_name,
      created_at: oldGameData.created_at,
      annotation: oldGameData.game_name
    }).select().single()
    if (insertError) throw new Error(`Failed to create game: ${insertError.message}`)

    // Handle homepage
    let hpInfo = 'Informace o pravidlech, tvorbě postav, náboru nových hráčů, četnosti hraní apod.'
    hpInfo = (hpData && !hpError) ? hpData.content : hpInfo

    const { error: homepageError } = await locals.supabase
      .from('codex_pages').update({ content: hpInfo }).eq('game', data.id)
    if (homepageError) throw new Error(`Failed to add homepage: ${homepageError.message}`)

    // Handle bookmark insertion
    const { error: bookmarkError } = await locals.supabase.from('bookmarks').upsert({
      user_id: locals.user.id,
      game_id: data.id
    }, {
      onConflict: 'user_id, game_id',
      ignoreDuplicates: true
    })
    if (bookmarkError) throw new Error(`Failed to add bookmark: ${bookmarkError.message}`)

    // Retrieve GM data
    const { data: gmData, error: gmError } = await locals.supabase
      .from('characters')
      .select('id')
      .eq('game', data.id)
      .eq('storyteller', true)
      .single()
    if (gmError) throw new Error(`GM character not found: ${gmError.message}`)

    // Insert game description as the first post
    if (gmData) {
      const { error: postError } = await locals.supabase.from('posts').insert({
        owner: gmData.id,
        owner_type: 'character',
        content: oldGameData.game_desc,
        thread: data.game_thread,
        created_at: oldGameData.created_at
      }).select().single()
      if (postError) throw new Error(`Failed to create initial game post: ${postError.message}`)
    } else {
      throw new Error('GM data retrieval was successful, but no GM was found for this game.')
    }

    const newGameId = data.id
    const newGameGmId = gmData.id
    const newGameThread = data.game_thread

    // Migrate characters
    const { data: oldCharData, error: oldCharError } = await locals.supabase
      .rpc('get_old_chars_by_game', { game_id_param: oldGameData.id_game })
    if (oldCharError) throw new Error(`Failed to retrieve characters: ${oldCharError.message}`)

    const idMap = {}
    for (const character of oldCharData) {
      const isAlive = character.game_id === oldGameData.id_game
      const isGm = character.gm_id === 1
      const result = await migrateOldCharacter(newGameId, newGameGmId, character, locals, isGm, isAlive)
      if (result.error) throw new Error(result.error)
      idMap[character.id_char] = isGm ? newGameGmId : result.id
    }

    // Migrate posts
    const result = await importAllPosts(oldGameData.id_game, newGameThread, idMap, locals)
    if (result.error) throw new Error(result.error)

    return { status: 200, message: 'Game creation and migration successful' }
  } catch (error) {
    return { error: error.message }
  }
}

async function migrateGame (gameId, locals) {
  try {
    // Check if the game belongs to the user and handle error
    const { data: gameData, error: gameError } = await locals.supabase
      .from('old_games')
      .select('*')
      .eq('id_game', parseInt(gameId, 10))
      .eq('gm_id', parseInt(locals.user.old_id, 10))
      .eq('migrated', false)
      .eq('migrating', false)
      .maybeSingle()
    if (gameError) throw new Error(`Failed to retrieve game data: ${gameError.message}`)
    if (!gameData) throw new Error('Game not found or migration already in progress.')

    // Update game migration status and handle errors
    const { error: updateError } = await locals.supabase.from('old_games').update({ migrating: true }).eq('id_game', gameId)
    if (updateError) throw new Error(`Failed to update game migration status: ${updateError.message}`)
    // Proceed with game creation and handle any errors in the process
    const result = await createGame(locals, gameData)
    if (result.error) {
      await locals.supabase.from('old_games').update({ migrating: false }).eq('id_game', gameId) // Revert migration status on error
      throw new Error(result.error)
    }

    return new Response(JSON.stringify({ status: 202, message: 'Game migration initiated successfully.' }), { status: 202 })
  } catch (error) {
    // Finalize status and return error message
    await locals.supabase.from('old_games').update({ migrating: false }).eq('id_game', gameId)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

async function migrateWork (workId, locals) {
  try {
    // Validate ownership and existence of the work
    const { data: workData, error: workError } = await locals.supabase
      .from('old_works')
      .select('*')
      .eq('id', workId)
      .eq('owner', locals.user.old_id)
      .eq('migrated', false)
      .maybeSingle()
    if (workError) throw new Error(`Failed to retrieve work: ${workError.message}`)
    if (!workData) throw new Error('Work not found or already migrated.')

    // Attempt to insert new work entry and handle errors
    const { data, error } = await locals.supabase.from('works').insert({
      owner: locals.user.id,
      name: workData.name,
      category: workData.category,
      content: workData.content,
      annotation: workData.annotation,
      tags: workData.tags,
      created_at: workData.post_date
    }).select().single()
    if (error) throw new Error(`Failed to insert new work: ${error.message}`)
    if (!data) throw new Error('New work insertion failed without specific error.')

    // Update migration status of the old work
    const { error: oldWorkError } = await locals.supabase.from('old_works').update({ migrated: true }).eq('id', workId)
    if (oldWorkError) throw new Error(`Failed to update old work status: ${oldWorkError.message}`)

    // Successfully migrated work
    return new Response(JSON.stringify({ status: 200, message: 'Work migrated successfully.' }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

async function migrateChar (charId, locals) {
  try {
    // Validate ownership and existence of the character
    const { data: charData, error: charError } = await locals.supabase
      .from('old_chars')
      .select('*')
      .eq('id_user', locals.user.old_id)
      .eq('id_char', charId)
      .eq('migrated', false)
      .maybeSingle()
    if (charError) throw new Error(`Failed to retrieve character data: ${charError.message}`)
    if (!charData) throw new Error('Character not found or already migrated.')

    // Attempt to create a new character entry
    const { data: newCharData, error: newCharError } = await locals.supabase.from('characters').insert({
      player: locals.user.id,
      name: charData.char_name,
      bio: charData.char_desc,
      storyteller_notes: charData.gm_notes,
      state: 'alive'
    }).select().single()
    if (newCharError) throw new Error(`Failed to insert new character: ${newCharError.message}`)
    if (!newCharData) throw new Error('New character insertion failed without specific error.')

    // Mark old character as migrated
    const { error: oldCharError } = await locals.supabase.from('old_chars').update({ migrated: true }).eq('id_char', charData.id_char)
    if (oldCharError) throw new Error(`Failed to update old character status: ${oldCharError.message}`)

    // Import portrait
    const result = await importPortrait(newCharData.id, charData.id_char, locals, false)
    if (result.error) console.log('Portrait not updated but do not care')

    // Successfully migrated character
    return new Response(JSON.stringify({ status: 200, message: 'Character migrated successfully.' }), { status: 200 })
  } catch (error) {
    // Error handling and response generation
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

async function importPortrait (newId, oldId, locals, isUser) {
  try {
    // Define the target filename for the new avatar
    const newAvatarName = `${newId}.jpg`

    // Attempt to remove the existing portrait if it exists (optional step)
    const { error: removeError } = await locals.supabase.storage.from('portraits').remove(newAvatarName)
    if (removeError) console.log('No need to remove portrait')

    // Define the source file path based on whether the portrait is for a user or a character
    const avatarName = isUser ? `old_icons_users/user_${oldId}.jpg` : `old_icons_chars/${oldId}.jpg`

    // Attempt to copy the old avatar to the new location
    const { data, error: copyError } = await locals.supabase.storage.from('portraits').copy(avatarName, newAvatarName)
    if (copyError) throw new Error(`Failed to copy portrait from ${avatarName} to ${newAvatarName}: ${copyError.message}`)
    if (!data) throw new Error(`Portrait not found: ${avatarName}`)

    // Update the database record to point to the new portrait
    const { error: hashError } = await locals.supabase.from(isUser ? 'profiles' : 'characters').update({ portrait: newAvatarName }).eq('id', newId)
    if (hashError) throw new Error(`Failed to update database for new portrait: ${hashError.message}`)

    return { status: 'Portrait imported successfully', portraitPath: newAvatarName }
  } catch (error) {
    return { error: error.message }
  }
}

async function importUserPortrait (oldId, locals) {
  try {
    // Validate the old ID matches the current user's ID to prevent unauthorized access
    if (oldId !== locals.user.old_id) {
      throw new Error('Attempt to access unauthorized portrait or missing user ID.')
    }
    // Import the user portrait and handle any errors
    const profileSet = await importPortrait(locals.user.id, locals.user.old_id, locals, true)
    if (profileSet.error) {
      throw new Error(profileSet.error)
    }
    // Return success response if the portrait is successfully imported
    if (profileSet) {
      return new Response(JSON.stringify({ status: 200, message: 'User portrait imported successfully.', portraitPath: profileSet.portraitPath }), { status: 200 })
    } else {
      throw new Error('Failed to import user portrait without a specific error.')
    }
  } catch (error) {
    // Handle and return any errors encountered during the import process
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

// Main API handler for migrate functions
export const POST = async ({ request, locals }) => {
  try {
    const { action, gameId, workId, charId, oldId } = await request.json()
    switch (action) {
      case 'migrate_game': return await migrateGame(gameId, locals)
      case 'migrate_work': return await migrateWork(workId, locals)
      case 'migrate_char': return await migrateChar(charId, locals)
      case 'import_user_portrait': return await importUserPortrait(oldId, locals)
      default: return new Response(JSON.stringify({ error: 'Unrecognized action' }), { status: 400 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An error occurred during processing: ' + error.message }), { status: 500 })
  }
}
