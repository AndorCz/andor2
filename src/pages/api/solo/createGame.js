// Create a new game from a solo concept

export const POST = async ({ request, locals, redirect }) => {
  try {
    const requestData = await request.json()
    const { conceptId } = requestData
    const referer = request.headers.get('referer')
    if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }

    // Check if the concept exists
    const { data: concept, error: conceptError } = await locals.supabase.from('solo_concepts').select('*').eq('id', conceptId).single()
    if (conceptError) { throw new Error('Chyba při načítání konceptu: ' + conceptError.message) }
    if (!concept) { throw new Error('Koncept nebyl nalezen') }

    // Create a new game
    const { data: gameData, error: gameError } = await locals.supabase.from('solo_games').insert({ concept_id: concept.id, name: concept.name, player: locals.user.id }).select().single()
    if (gameError) { throw new Error('Chyba při vytváření nové hry: ' + gameError.message) }

    // Add game to bookmarks
    const { error: bookmarkError } = await locals.supabase.from('bookmarks').upsert({ user_id: locals.user.id, solo_id: gameData.id }, { onConflict: 'user_id, solo_id', ignoreDuplicates: true })
    if (bookmarkError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(bookmarkError.message)) }

    // Redirect to the new game page
    return redirect(`/solo/game/${gameData.id}?toastType=success&toastText=${encodeURIComponent('Nová hra byla úspěšně vytvořena!')}`)
  } catch (error) {
    console.error('API Error in creating new game:', error)
    return new Response(JSON.stringify({ error: { message: 'Chyba při vytváření nové hry: ' + error.message } }), { status: 500 })
  }
}
