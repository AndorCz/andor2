import { Type } from '@google/genai'
import { generateImage } from '@lib/solo/server-replicate'
import { getStamp, clone } from '@lib/utils'
import { getAI } from '@lib/solo/server-gemini'
import { getPrompts, getContext, fieldNames, assistantParams } from '@lib/solo/solo'

// Generate content of a single field of a solo game concept
export const POST = async ({ request, locals, redirect }) => {
  try {
    const { conceptId, field, value } = await request.json()
    if (!locals.user.id || !conceptId || !field) { return redirect(request.headers.get('referer') + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }
    const ai = getAI(locals.runtime.env)

    // Save updated field data, mark concept as generating and load current concept data
    const updatedConcept = { generating: [field] }
    if (typeof value === 'string' && field !== 'protagonist_names' && field !== 'inventory') { updatedConcept[field] = value } // If value is provided, update the field with it
    const { data: conceptData, error: markingError } = await locals.supabase.from('solo_concepts').update(updatedConcept).eq('id', conceptId).select().single()
    if (markingError) { throw new Error(markingError.message) }

    const prompts = getPrompts(conceptData)
    const generationParams = clone(assistantParams)

    // Set common parameters for generation
    if (['prompt_world', 'prompt_protagonist', 'prompt_plan', 'protagonist_names', 'inventory', 'prompt_locations', 'prompt_factions', 'prompt_characters', 'prompt_header_image', 'prompt_storyteller_image'].includes(field)) {
      generationParams.config.systemInstruction += getContext(conceptData, field)
      generationParams.contents = [{ text: prompts[field], role: 'user' }]
      if (value) { generationParams.contents[0].text += `\nVypravěč uvedl toto zadání: "${value}"` }
    }

    // Structured output for names
    if (field === 'protagonist_names' || field === 'inventory') {
      generationParams.config.responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } }
      generationParams.config.responseMimeType = 'application/json'
    }

    // Generate new content
    const modelResponse = await ai.models.generateContent(generationParams)
    if (modelResponse.candidates?.[0].finish_reason === 'SAFETY') { throw new Error('Generovaný obsah byl zablokován kvůli bezpečnostním pravidlům AI. Zkus prosím změnit zadání.') }
    // const responseLast = modelResponse.candidates?.[0]?.content?.parts?.[0]?.text || modelResponse.text // probably not needed

    const newData = { generating: [] }
    const target = field.replace('prompt_', 'generated_')
    newData[target] = field === 'protagonist_names' || field === 'inventory' ? JSON.parse(modelResponse.text) : modelResponse.text

    // Update game plan if needed
    if (['prompt_world', 'prompt_factions', 'prompt_locations', 'prompt_characters', 'prompt_protagonist', 'prompt_plan'].includes(field)) {
      generationParams.model = 'gemini-2.5-flash'
      generationParams.config.thinkingConfig = { thinkingBudget: 1000 }

      // If a plan-relevant field have changed, include it in the plan prompt
      let prompt = prompts.prompt_plan
      if (field !== 'prompt_plan') {
        prompt = `${fieldNames[field]}: ${newData[target]}\n\n${prompts.prompt_plan}`
      }
      if (conceptData.prompt_plan) { prompt += `\nVypravěč uvedl toto zadání: "${conceptData.prompt_plan}"` }
      generationParams.contents = [{ text: prompt, role: 'user' }]

      const planResponse = await ai.models.generateContent(generationParams)
      newData.generated_plan = planResponse.text
    }

    // Update header image if requested
    if (field === 'prompt_header_image') {
      const { data: headerImage, error: imageError } = await generateImage(locals.runtime.env, newData.generated_header_image, 'header')
      if (imageError) { throw new Error(imageError.message) }
      if (headerImage) {
        const { error: headerUploadError } = await locals.supabase.storage.from('headers').upload(`solo-${conceptData.id}.jpg`, headerImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: newData.generated_header_image } })
        if (headerUploadError) { throw new Error(headerUploadError.message) }
        newData.custom_header = getStamp()
      }
    }

    // Update storyteller image if requested
    if (field === 'prompt_storyteller_image') {
      const { data: storytellerImage, error: imageError } = await generateImage(locals.runtime.env, newData.generated_storyteller_image, 'npc')
      if (imageError) { throw new Error(imageError.message) }
      if (storytellerImage) {
        const { error: storytellerUploadError } = await locals.supabase.storage.from('portraits').upload(`${conceptData.storyteller}.jpg`, storytellerImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: newData.generated_storyteller_image } })
        if (storytellerUploadError) { throw new Error(storytellerUploadError.message) }
        const { error: storytellerUpdateError } = await locals.supabase.from('npcs').update({ portrait: getStamp() }).eq('id', conceptData.storyteller)
        if (storytellerUpdateError) { throw new Error(storytellerUpdateError.message) }
      }
    }

    // Save generated content
    const { error: updateError } = await locals.supabase.from('solo_concepts').update(newData).eq('id', conceptData.id)
    if (updateError) { throw new Error(updateError.message) }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error in generateField API:', error)
    await locals.supabase.from('solo_concepts').update({ generating: [] }).eq('id', await request.json().conceptId)
    return new Response(JSON.stringify({ error: { message: 'Chyba při generování pole: ' + error.message } }), { status: 500 })
  }
}
