
export const GET = async ({ request, cookies, redirect, locals }) => {
  const { gameId, characterId } = request.query

  // get character data
  const { data, error } = await locals.supabase.from('characters').select('*').eq('id', characterId).single()
  if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 404 }) }

  if (data.transfer_to === locals.user.id) { // update character
    const { error } = await locals.supabase.from('characters').update({ player: locals.user.id, transfer_to: null }).eq('id', characterId)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
    return redirect(`/game/${gameId}?tab=chars&toastType=success&toastText=` + encodeURIComponent('Postava byla přijata'))
  } else {
    return new Response(JSON.stringify({ error: 'Nemáš právo přijmout tuto postavu' }), { status: 403 })
  }
}
