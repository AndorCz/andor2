import { notifyCharacterChange } from '@lib/character-notifications'

export const GET = async ({ request, url, redirect, locals }) => {
  const referer = request.headers.get('referer')
  const { gameId, characterId } = Object.fromEntries(url.searchParams)
  if (!locals.user.id || !gameId || !characterId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o postavě')) }

  const { data: character, error: characterError } = await locals.supabase.from('characters').select('id, name, game').eq('id', characterId).eq('game', gameId).eq('transfer_to', locals.user.id).maybeSingle()
  if (characterError || !character) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(characterError?.message || 'Postava nenalezena, nebo se převádí na jiného uživatele.')) }

  // get character data
  const { data, error } = await locals.supabase.rpc('transfer_character', { character_id: characterId })
  if (error) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(error.message)) }

  if (!data) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Nemáš právo na tuto akci')) }
  const { error: notificationError } = await notifyCharacterChange(locals.supabase, { gameId: character.game, character, senderId: locals.user.id, action: 'Přijal/a jsem převod postavy.' })
  if (notificationError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(notificationError.message)) }

  // update message
  const { error: messageUpdateError } = await locals.supabase.rpc('update_transfer_message', { character_id: characterId, game_id: gameId, new_content: '<br>Přijato!' })
  if (messageUpdateError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(messageUpdateError.message)) }

  // add game bookmark
  const { data: gameData, error: gameError } = await locals.supabase
    .from('games')
    .select('game_thread, discussion_thread')
    .eq('id', gameId)
    .single()
  if (gameError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(gameError.message)) }

  const { error: bookmarkError } = await locals.supabase.from('bookmarks').upsert({ user_id: locals.user.id, game_id: gameId, game_main_thread: gameData.game_thread, game_discussion_thread: gameData.discussion_thread }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
  if (bookmarkError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(bookmarkError.message)) }

  await locals.supabase.from('read_threads').upsert([{ user_id: locals.user.id, thread_id: gameData.game_thread }, { user_id: locals.user.id, thread_id: gameData.discussion_thread }], { onConflict: 'user_id, thread_id', ignoreDuplicates: true })
  await locals.supabase.from('unread_threads').upsert([{ user_id: locals.user.id, thread_id: gameData.game_thread, unread_count: 0 }, { user_id: locals.user.id, thread_id: gameData.discussion_thread, unread_count: 0 }], { onConflict: 'user_id, thread_id', ignoreDuplicates: true })

  return redirect(`/game/${gameId}?tab=chars&toastType=success&toastText=` + encodeURIComponent('Postava byla přijata'))
}
