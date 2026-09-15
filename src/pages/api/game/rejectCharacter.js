import { notifyCharacterChange } from '@lib/character-notifications'

export const GET = async ({ request, url, redirect, locals }) => {
  const referer = request.headers.get('referer')
  const { gameId, characterId } = Object.fromEntries(url.searchParams)
  if (!locals.user.id || !gameId || !characterId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o postavě')) }

  const { data: character, error: characterError } = await locals.supabase.from('characters').select('id, name, game').eq('id', characterId).eq('game', gameId).eq('transfer_to', locals.user.id).maybeSingle()
  if (characterError || !character) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(characterError?.message || 'Postava nenalezena, nebo se převádí na jiného uživatele.')) }

  // get character data
  const { data, error } = await locals.supabase.rpc('reject_transfer', { character_id: characterId })

  if (error) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(error.message)) }

  if (!data) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Nemáš právo na tuto akci')) }
  const { error: notificationError } = await notifyCharacterChange(locals.supabase, { gameId: character.game, character, senderId: locals.user.id, action: 'Odmítl/a jsem nabídku převodu postavy.' })
  if (notificationError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(notificationError.message)) }

  // update message
  const { error: messageUpdateError } = await locals.supabase.rpc('update_transfer_message', { character_id: characterId, game_id: gameId, new_content: '<br>Odmítnuto!' })
  if (messageUpdateError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(messageUpdateError.message)) }

  return redirect(`/game/${gameId}?tab=chars&toastType=success&toastText=` + encodeURIComponent('Postava byla odmítnuta'))
}
