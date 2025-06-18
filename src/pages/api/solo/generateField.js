import { getHash } from '@lib/utils'
import { getBasePrompt, ai, aiConfig, prompts, generateHeaderImage } from '@lib/solo/gemini'

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
function getContext (conceptData, exclude) {
  const context = {
    basePrompt: getBasePrompt(conceptData),
    world: { text: conceptData.generated_world },
    factions: { text: conceptData.generated_factions },
    locations: { text: conceptData.generated_locations },
    characters: { text: conceptData.generated_characters },
    protagonist: { text: conceptData.generated_protagonist }
  }
  delete context[exclude]
  return Object.values(context)
}

// Generate content of a single field of a solo game concept
export const POST = async ({ request, locals, redirect }) => {
  let conceptData
  const requestData = await request.json()
  const { conceptId, field, value } = requestData
  try {
    const referer = request.headers.get('referer')
    if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }

    // Mark concept as generating and get current data
    const { data: dbData, error: markingError } = await locals.supabase.from('solo_concepts')
      .update({ generating: true, ['generated_' + field]: 'generating' }).eq('id', conceptId)
      .select().single()
    if (markingError) { throw new Error(markingError.message) }
    conceptData = dbData

    // Prepare AI context and prompt
    const context = getContext(conceptData, field)
    const fieldMessage = { text: prompts[field] }
    if (value) { fieldMessage.text += `Vypravěč uvedl toto zadání: "${value}"` }
    aiConfig.contents = [...context, fieldMessage]

    // Generate field
    const fieldResponse = await ai.models.generateContent(aiConfig)
    if (fieldResponse.candidates?.[0].finish_reason === 'SAFETY') {
      throw new Error('Generovaný obsah byl zablokován kvůli bezpečnostním pravidlům AI. Zkus prosím změnit zadání.')
    }

    const generatedContent = fieldResponse.text
    const newData = { ['generated_' + field]: generatedContent, generating: false }

    // Update game plan if necessary
    if (field !== 'image' && field !== 'annotation') {
      const planMessage = {
        text: `The previous game plan was as follows: "${conceptData.generated_plan}"
        Now the information in the section "${field}" has changed, please update the game plan, if needed.`
      }
      aiConfig.contents = [...context, planMessage]
      const planResponse = await ai.models.generateContent({ ...aiConfig, config: { ...aiConfig.config, thinkingConfig: { thinkingBudget: 1000 } } })
      newData.generated_plan = planResponse.text
    }

    // Update header image if necessary
    if (field === 'image') {
      const { data: image, error: imageError } = await generateHeaderImage(generatedContent)
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
    await locals.supabase.from('solo_concepts').update({ generating: false, ['generated_' + field]: '' }).eq('id', conceptData.id)
    return new Response(JSON.stringify({ error: { message: 'Chyba při generování pole: ' + error.message } }), { status: 500 })
  }
}
