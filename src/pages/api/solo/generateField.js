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
  let error = ''

  const requestData = await request.json()
  const { conceptId, field, value } = requestData
  const referer = request.headers.get('referer')
  if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }

  // Get concept data
  const { data: conceptData, error: conceptError } = await locals.supabase.from('solo_concepts').select().eq('id', conceptId).maybeSingle()
  if (conceptError) { error = conceptError.message }

  // Prepare AI context and prompt
  const context = getContext(conceptData, field)
  const fieldMessage = { text: prompts[field] }
  if (value) { fieldMessage.text += `Vypravěč uvedl toto zadání: "${value}"` }

  aiConfig.contents = [...context, fieldMessage]
  console.log('contents', aiConfig.contents)

  // Generate field
  const fieldResponse = await ai.models.generateContent(aiConfig)
  if (fieldResponse.candidates?.[0].finish_reason === 'SAFETY') {
    error = 'Generovaný obsah byl zablokován kvůli bezpečnostním pravidlům AI. Zkus prosím změnit zadání.'
  }

  console.log('fieldResponse?.[0]:', fieldResponse.candidates?.[0])
  const generatedContent = fieldResponse.text
  console.log('generatedContent:', generatedContent)
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
    const headerImageBuffer = await generateHeaderImage(generatedContent)
    if (headerImageBuffer) {
      const { error: uploadError } = await locals.supabase.storage.from('headers').upload(`solo-${conceptData.id}.png`, headerImageBuffer, { contentType: 'image/jpg' })
      if (uploadError) { console.error('Error uploading image:', uploadError) }
    }
    newData.custom_header = getHash()
  }

  // Save generated content
  const { error: updateError } = await locals.supabase.from('solo_concepts').update(newData).eq('id', conceptData.id)
  if (updateError) { error = updateError.message }

  if (error) {
    await locals.supabase.from('solo_concepts').update({ generating: false }).eq('id', conceptData.id)
    console.error('Error updating concept:', error)
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chyba při generování obsahu: ' + error))
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
