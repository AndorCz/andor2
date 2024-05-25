export const GET = async ({ request, url, redirect, locals }) => {
  const referer = request.headers.get('referer')
  const { gameId, characterId } = Object.fromEntries(url.searchParams)
  if (!locals.user.id || !gameId || !characterId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o postavě')) }

  // get character data
  const { data, error } = await locals.supabase.rpc('reject_transfer', { character_id: characterId })

  if (error) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(error.message)) }

  // update message
  const { error: messageUpdateError } = await locals.supabase.rpc('update_transfer_message', { character_id: characterId, game_id: gameId, new_content: '<br>Odmítnuto!' })
  if (messageUpdateError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(error.message)) }

  if (data) {
    return redirect(`/game/${gameId}?tab=chars&toastType=success&toastText=` + encodeURIComponent('Postava byla odmítnuta'))
  } else {
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Nemáš právo na tuto akci'))
  }
}
