import { Type } from '@google/genai'
import { getHash } from '@lib/utils'
import { GoogleGenAI } from '@google/genai'
import { assistantParams, prompts, generateImage, getContext } from '@lib/solo/server-gemini'

// Generate content of a single field of a solo game concept
export const POST = async ({ request, locals, redirect }) => {
  try {
    const { conceptId, field, value } = await request.json()
    if (!locals.user.id || !conceptId || !field) { return redirect(request.headers.get('referer') + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }

    // Mark concept as generating and get current data
    const { data: conceptData, error: markingError } = await locals.supabase.from('solo_concepts').update({ generating: field }).eq('id', conceptId).select().single()
    if (markingError) { throw new Error(markingError.message) }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI })
    const generationParams = { ...assistantParams }

    // Set common parameters for generation
    if (['prompt_world', 'prompt_protagonist', 'prompt_plan', 'protagonist_names', 'prompt_locations', 'prompt_factions', 'prompt_characters', 'prompt_header_image', 'prompt_storyteller_image'].includes(field)) {
      generationParams.config.systemInstruction += getContext(conceptData, field)
      generationParams.contents = [{ text: prompts[field], role: 'user' }]
      if (value) { generationParams.contents[0].text += `Vypravěč uvedl toto zadání: "${value}"` }
    }

    // Structured output for names
    if (field === 'protagonist_names') {
      generationParams.config.responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } }
      generationParams.config.responseMimeType = 'application/json'
    }

    // Generate new content
    const newData = { generating: [] }
    const modelResponse = ai.models.generateContent(generationParams)
    if (modelResponse.candidates?.[0].finish_reason === 'SAFETY') { throw new Error('Generovaný obsah byl zablokován kvůli bezpečnostním pravidlům AI. Zkus prosím změnit zadání.') }
    // const responseLast = modelResponse.candidates?.[0]?.content?.parts?.[0]?.text || modelResponse.text // probably not needed
    console.log('response', modelResponse.text)

    // Update game plan if needed
    if (['prompt_world', 'prompt_factions', 'prompt_locations', 'prompt_characters', 'prompt_protagonist', 'prompt_plan'].includes(field)) {
      generationParams.model = 'gemini-2.5-flash'
      generationParams.config.thinkingConfig = { thinkingBudget: 1000 }
      const planResponse = await ai.models.generateContent(generationParams)
      newData.generated_plan = planResponse.text
    }

    // Update header image if requested
    if (field === 'prompt_header_image') {
      const { data: headerImage, error: imageError } = await generateImage(newData.prompt_header_image, '16:9', 1100, 226)
      if (imageError) { throw new Error(imageError.message) }
      if (headerImage) {
        const { error: headerUploadError } = await locals.supabase.storage.from('headers').upload(`solo-${conceptData.id}.jpg`, headerImage, { contentType: 'image/jpg', upsert: true })
        if (headerUploadError) { throw new Error(headerUploadError.message) }
        newData.custom_header = getHash()
      }
    }

    // Update storyteller image if requested
    if (field === 'prompt_storyteller_image') {
      const { data: storytellerImage, error: imageError } = await generateImage(newData.prompt_storyteller_image, '9:16', 140, 352)
      if (imageError) { throw new Error(imageError.message) }
      if (storytellerImage) {
        const { error: storytellerUploadError } = await locals.supabase.storage.from('npcs').upload(`${conceptData.id}/${conceptData.storyteller}.jpg`, storytellerImage, { contentType: 'image/jpg', upsert: true })
        if (storytellerUploadError) { throw new Error(storytellerUploadError.message) }
        const { error: storytellerUpdateError } = await locals.supabase.from('npcs').update({ portrait: getHash() }).eq('id', conceptData.storyteller)
        if (storytellerUpdateError) { throw new Error(storytellerUpdateError.message) }
      }
    }

    // Save generated content
    const target = field.replace('prompt_', 'generated_')
    newData[target] = field === 'protagonist_names' ? JSON.parse(modelResponse.text) : modelResponse.text
    const { error: updateError } = await locals.supabase.from('solo_concepts').update(newData).eq('id', conceptData.id)
    if (updateError) { throw new Error(updateError.message) }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error in generateField API:', error)
    await locals.supabase.from('solo_concepts').update({ generating: [] }).eq('id', await request.json().conceptId)
    return new Response(JSON.stringify({ error: { message: 'Chyba při generování pole: ' + error.message } }), { status: 500 })
  }
}
