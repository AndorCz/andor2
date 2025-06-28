import { Type } from '@google/genai'
import { getHash } from '@lib/utils'
import { getContext } from '@lib/solo/gemini'
import { ai, assistantConfig, prompts, generateImage } from '@lib/solo/server-gemini'

// Generate content of a single field of a solo game concept
export const POST = async ({ request, locals, redirect }) => {
  let conceptData
  let generatedContent
  const requestData = await request.json()
  const { conceptId, promptField, targetField, value } = requestData
  const fieldName = promptField ? promptField.replace('prompt_', '') : targetField
  if (!prompts[fieldName]) { throw new Error(`Prompt pro pole "${fieldName}" nebyl nalezen`) }

  try {
    const referer = request.headers.get('referer')
    if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }

    // Mark concept as generating and get current data
    const { data: dbData, error: markingError } = await locals.supabase.from('solo_concepts').update({ generating: [targetField] }).eq('id', conceptId).select().single()
    if (markingError) { throw new Error(markingError.message) }
    conceptData = dbData

    // Prepare AI context and prompt
    const context = getContext(conceptData, fieldName)
    const newData = { generating: [] }

    // Update the requested field
    if (fieldName !== 'plan') { // plan is going to be generated anyway
      const fieldMessage = { text: prompts[fieldName] }
      if (value) { fieldMessage.text += `Vypravěč uvedl toto zadání: "${value}"` }

      // Structured config for protagonist_names
      if (fieldName === 'protagonist_names') {
        assistantConfig.config = { ...assistantConfig.config, responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }, responseMimeType: 'application/json' }
      }

      // Generate field
      const fieldResponse = await ai.models.generateContent({ ...assistantConfig, contents: [...context, fieldMessage] })
      if (fieldResponse.candidates?.[0].finish_reason === 'SAFETY') {
        throw new Error('Generovaný obsah byl zablokován kvůli bezpečnostním pravidlům AI. Zkus prosím změnit zadání.')
      }
      generatedContent = fieldName === 'protagonist_names' ? JSON.parse(fieldResponse.text) : fieldResponse.text
      newData[targetField] = generatedContent
    }

    // Update game plan (almost always needed)
    if (fieldName !== 'protagonist_names' && fieldName !== 'image' && fieldName !== 'annotation') {
      const planMessage = {
        text: `The previous game plan was as follows: "${conceptData.generated_plan}"
        Now the information in the section "${fieldName}" has changed, please update the game plan, if needed.`
      }
      const planResponse = await ai.models.generateContent({ ...assistantConfig, contents: [...context, planMessage], config: { ...assistantConfig.config, thinkingConfig: { thinkingBudget: 1000 } } })
      newData.generated_plan = planResponse.text

      // Update annotation
      const annotationMessage = { text: prompts.annotation }
      const annotationResponse = await ai.models.generateContent({ ...assistantConfig, contents: [...context, annotationMessage], config: { ...assistantConfig.config } })
      newData.annotation = annotationResponse.text
    }

    // Update header image if requested
    if (fieldName === 'image') {
      const { data: image, error: imageError } = await generateImage(value, '16:9', 1100, 226)
      if (imageError) { throw new Error(imageError.message) }
      if (image) {
        const { error: uploadError } = await locals.supabase.storage.from('headers').upload(`solo-${conceptData.id}.jpg`, image, { contentType: 'image/jpg' })
        if (uploadError) { throw new Error(uploadError.message) }
        newData.custom_header = getHash()
      }
    }

    // Save generated content
    const { error: updateError } = await locals.supabase.from('solo_concepts').update(newData).eq('id', conceptData.id)
    if (updateError) { throw new Error(updateError.message) }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error in generateField API:', error)
    await locals.supabase.from('solo_concepts').update({ generating: [] }).eq('id', conceptData.id)
    return new Response(JSON.stringify({ error: { message: 'Chyba při generování pole: ' + error.message } }), { status: 500 })
  }
}
