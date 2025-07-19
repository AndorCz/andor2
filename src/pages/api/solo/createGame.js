// Create a new game from a solo concept
import { generateImage } from '@lib/solo/server-aiml'
import { getHash, getImageUrl } from '@lib/utils'
import { getAI, prompts, assistantParams, storytellerParams, getContext } from '@lib/solo/server-gemini'

export const GET = async ({ request, locals, redirect }) => {
  let game = null
  try {
    const ai = getAI(locals.runtime.env)
    const { searchParams } = new URL(request.url)
    const conceptId = searchParams.get('conceptId')
    const characterName = searchParams.get('characterName')
    const referer = request.headers.get('referer')
    if (!locals.user.id || !conceptId || !characterName) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení, data o konceptu nebo jméno postavy')) }

    // Check if the concept exists
    const { data: concept, error: conceptError } = await locals.supabase.from('solo_concepts').select('*').eq('id', conceptId).single()
    if (conceptError) { throw new Error('Chyba při načítání konceptu: ' + conceptError.message) }
    if (!concept) { throw new Error('Koncept nebyl nalezen') }
    const context = getContext(concept, null, characterName, concept.inventory)

    // Increment the concept's play count
    const { error: incrementError } = await locals.supabase.from('solo_concepts').update({ game_count: (concept.game_count || 0) + 1 }).eq('id', concept.id)
    if (incrementError) { throw new Error('Chyba při aktualizaci počtu her: ' + incrementError.message) }

    // Create a new game
    const { data: gameData, error: gameError } = await locals.supabase.from('solo_games').insert({ concept_id: concept.id, name: concept.name, player: locals.user.id, inventory: concept.inventory }).select().single()
    if (gameError) { throw new Error('Chyba při vytváření nové hry: ' + gameError.message) }
    game = gameData

    // Generate player character portrait prompt
    const characterImagePromptMessage = { text: prompts.protagonist_image + `Postava se jmenuje "${characterName}"` }
    const characterImagePromptResponse = await ai.models.generateContent({ ...assistantParams, contents: [{ text: context }, characterImagePromptMessage] })
    const portraitPrompt = characterImagePromptResponse.text

    // Create a new player character
    const { data: characterData, error: characterError } = await locals.supabase.from('characters').insert({ name: characterName, appearance: concept.generated_protagonist, player: locals.user.id, solo_game: gameData.id, portrait: getHash(), portrait_prompt: portraitPrompt }).select().single()
    if (characterError) { throw new Error('Chyba při vytváření postavy: ' + characterError.message) }

    // Add game to bookmarks
    const { error: bookmarkError } = await locals.supabase.from('bookmarks').upsert({ user_id: locals.user.id, solo_id: gameData.id }, { onConflict: 'user_id, solo_id', ignoreDuplicates: true })
    if (bookmarkError) { throw new Error('Chyba při přidávání záložky: ' + bookmarkError.message) }

    // Generate character portrait image
    const { data: portraitImage, error: portraitError } = await generateImage(locals.runtime.env, portraitPrompt, 'npc')
    if (portraitError) { throw new Error('Chyba při generování portrétu postavy: ' + portraitError.message) }
    if (portraitImage) {
      const { error: uploadError } = await locals.supabase.storage.from('portraits').upload(`${characterData.id}.jpg`, portraitImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: portraitPrompt } })
      if (uploadError) { throw new Error('Chyba při nahrávání portrétu: ' + uploadError.message) }
    }

    // Generate first post
    const firstPostPrompt = {
      text: `
        ${context}
        <h2>Plán hry</h2>
        ${concept.generated_plan}
        <h2>Instrukce</h2>
        ${prompts.firstPost}
      `
    }
    const response = await ai.models.generateContent({ ...storytellerParams, contents: [firstPostPrompt] })
    const firstPost = JSON.parse(response.text)

    // Generate illustration for the first post
    let firstImagePrompt = firstPost.image.prompt
    if (!firstImagePrompt) {
      const metaPrompt = { text: prompts.first_image + `Pro následující popis scény vymysli jak scénu nejlépe vystihnout vizuálně a popiš jako plaintext prompt pro vygenerování ilustračního obrázku:\n${firstPost.post}` }
      const firstImagePromptResponse = await ai.models.generateContent({ ...assistantParams, contents: [...context, metaPrompt] })
      firstImagePrompt = firstImagePromptResponse.text
    }
    const { data: sceneImage, error: sceneImageError } = await generateImage(locals.runtime.env, firstImagePrompt, 'scene')
    if (sceneImageError) { throw new Error(sceneImageError.message) }
    if (sceneImage) {
      const { data: uploadData, error: uploadError } = await locals.supabase.storage.from('scenes').upload(`${gameData.id}/${new Date().getTime()}.jpg`, sceneImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: firstImagePrompt } })
      if (uploadError) { throw new Error(uploadError.message) }
      const imageUrl = getImageUrl(locals.supabase, uploadData.path, 'scenes')
      // Save first post illustration
      const { error: introError } = await locals.supabase.from('posts').insert({ thread: gameData.thread, content: `<img src='${imageUrl}' alt='intro illustration' />`, owner_type: 'npc' })
      if (introError) { throw new Error(introError.message) }
    }

    // Save the first post
    const { error: addPostError } = await locals.supabase.from('posts').insert({ thread: gameData.thread, content: firstPost.post, owner_type: 'npc', owner: concept.storyteller })
    if (addPostError) { throw new Error(addPostError.message) }

    // Return success object
    return new Response(JSON.stringify({ success: true, gameId: gameData.id }), { status: 200 })
  } catch (error) {
    console.error('API Error in creating new game:', error)
    if (game) { await locals.supabase.from('solo_games').delete().eq('id', game.id) } // clean up
    return new Response(JSON.stringify({ error: { message: 'Chyba při vytváření nové hry: ' + error.message } }), { status: 500 })
  }
}
