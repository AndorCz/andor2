// Create a new game from a solo concept

import { ai } from '@lib/solo/server-gemini'
import { getContext, storytellerInstructions } from '@lib/solo/gemini'

const storytellerConfig = {
  model: 'gemini-2.5-flash',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    thinkingConfig: { thinkingBudget: 200 },
    systemInstruction: storytellerInstructions
  }
}

export const GET = async ({ request, locals, redirect }) => {
  try {
    const { searchParams } = new URL(request.url)
    const conceptId = searchParams.get('conceptId')
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

    // Generate first post
    const context = getContext(concept)
    const response = await ai.models.generateContent({ ...storytellerConfig, contents: [...context, { text: 'Napiš stručný a poutavý první příspěvek hry, který hráče uvede do příběhu.' }] })
    const firstPost = response.text
    const { error: addPostError } = await locals.supabase.from('posts').insert({ thread: gameData.thread, content: firstPost, owner_type: 'ai-storyteller' })
    if (addPostError) { throw new Error(addPostError.message) }

    // Generate first scene image

    // Redirect to the new game page
    return redirect(`/solo/game/${gameData.id}?toastType=success&toastText=${encodeURIComponent('Nová hra byla úspěšně vytvořena!')}`)
  } catch (error) {
    console.error('API Error in creating new game:', error)
    return new Response(JSON.stringify({ error: { message: 'Chyba při vytváření nové hry: ' + error.message } }), { status: 500 })
  }
}
