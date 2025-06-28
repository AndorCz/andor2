// Create a new game from a solo concept
import { ai, generateImage, prompts } from '@lib/solo/server-gemini'
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
    const characterName = searchParams.get('characterName')
    const referer = request.headers.get('referer')
    if (!locals.user.id || !conceptId || !characterName) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení, data o konceptu nebo jméno postavy')) }

    // Check if the concept exists
    const { data: concept, error: conceptError } = await locals.supabase.from('solo_concepts').select('*').eq('id', conceptId).single()
    if (conceptError) { throw new Error('Chyba při načítání konceptu: ' + conceptError.message) }
    if (!concept) { throw new Error('Koncept nebyl nalezen') }

    // Increment the concept's play count
    const { error: incrementError } = await locals.supabase.from('solo_concepts').update({ game_count: (concept.game_count || 0) + 1 }).eq('id', concept.id)
    if (incrementError) { throw new Error('Chyba při aktualizaci počtu her: ' + incrementError.message) }

    // Create a new game
    const { data: gameData, error: gameError } = await locals.supabase.from('solo_games').insert({ concept_id: concept.id, name: concept.name, player: locals.user.id }).select().single()
    if (gameError) { throw new Error('Chyba při vytváření nové hry: ' + gameError.message) }

    // Create a new player character
    const { data: characterData, error: characterError } = await locals.supabase.from('characters').insert({ name: characterName, appearance: concept.generated_protagonist, player_id: locals.user.id, solo_game: gameData.id, portrait: getHash() }).select().single()
    if (characterError) { throw new Error('Chyba při vytváření postavy: ' + characterError.message) }

    // Add game to bookmarks
    const { error: bookmarkError } = await locals.supabase.from('bookmarks').upsert({ user_id: locals.user.id, solo_id: gameData.id }, { onConflict: 'user_id, solo_id', ignoreDuplicates: true })
    if (bookmarkError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(bookmarkError.message)) }

    // Context generation
    const context = getContext(concept)

    // Generate player character portrait
    const characterImagePromptMessage = { text: prompts.protagonist_image + `Postava se jmenuje "${characterName}"` }
    const characterImagePromptResponse = await ai.models.generateContent({ ...assistantConfig, contents: [...context, characterImagePromptMessage] })
    const { data: portraitImage, error: portraitError } = await generateImage(characterImagePromptResponse.text, '9:16', 140, 352)
    if (portraitError) { throw new Error('Chyba při generování portrétu postavy: ' + portraitError.message) }
    if (portraitImage) {
      const { error: uploadError } = await locals.supabase.storage.from('portraits').upload(`${characterData.id}.jpg`, portraitImage, { contentType: 'image/jpg' })
      if (uploadError) { throw new Error('Chyba při nahrávání portrétu: ' + uploadError.message) }
    }

    // Generate first post
    const response = await ai.models.generateContent({ ...storytellerConfig, contents: [...context, { text: 'Napiš stručný a poutavý první příspěvek hry, který hráče uvede do příběhu.' }] })
    const firstPost = response.text

    // Generate illustration for the first post
    const firstImagePrompt = { text: prompts.first_image + `Text herního příspěvku k vyobrazení: ${firstPost}` }
    const firstImagePromptResponse = await ai.models.generateContent({ ...assistantConfig, contents: [...context, firstImagePrompt] })
    const { data: sceneImage, error: sceneImageError } = await generateImage(firstImagePromptResponse.text, '16:9', 1408, 768)
    if (sceneImageError) { error = sceneImageError.message }
    if (sceneImage) {
      const { data: uploadData, error: uploadError } = await supabase.storage.from('locations').upload(`${gameData.id}/${new Date().getTime()}.jpg`, sceneImage, { contentType: 'image/jpg' })
      if (uploadError) { throw new Error(uploadError.message) }
      // const imageUrl = supabase.storage.from('locations').getPublicUrl(uploadData.path).publicURL
      firstPost += `<p><img src='${uploadData.fullPath}' alt='Scene Image' /></p>`
    }

    // Save the first post with the image
    const { error: addPostError } = await locals.supabase.from('posts').insert({ thread: gameData.thread, content: firstPost, owner_type: 'npc', owner: concept.storyteller })
    if (addPostError) { throw new Error(addPostError.message) }

    // Redirect to the new game page
    return redirect(`/solo/game/${gameData.id}?toastType=success&toastText=${encodeURIComponent('Nová hra byla úspěšně vytvořena!')}`)
  } catch (error) {
    console.error('API Error in creating new game:', error)
    return new Response(JSON.stringify({ error: { message: 'Chyba při vytváření nové hry: ' + error.message } }), { status: 500 })
  }
}
