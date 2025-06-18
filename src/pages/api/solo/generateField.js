import { getBasePrompt, ai, aiConfig } from '@lib/solo/gemini'

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
function getContext (conceptData, exclude) {
  const context = {
    basePrompt: getBasePrompt(conceptData),
    prompt_world: { text: conceptData.generated_world },
    prompt_factions: { text: conceptData.generated_factions },
    prompt_locations: { text: conceptData.generated_locations },
    prompt_characters: { text: conceptData.generated_characters },
    prompt_protagonist: { text: conceptData.generated_protagonist }
  }
  delete context[exclude]
  return Object.values(context)
}

// Generate content of a single field of a solo game concept
export const POST = async ({ request, locals, redirect }) => {
  const requestData = await request.json()
  const { conceptId, fieldName } = requestData
  const referer = request.headers.get('referer')
  if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }

  // Get concept data
  const { data: conceptData, error: conceptError } = await locals.supabase.from('solo_concepts').select().eq('id', conceptId).maybeSingle()
  if (conceptError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError.message)) }

  // Generate
  const context = getContext(conceptData, fieldName)
  const fieldMessage = { text: conceptData[fieldName] }
  aiConfig.contents = [...context, fieldMessage]
  console.log('contents', aiConfig.contents)
  const fieldResponse = await ai.models.generateContent(aiConfig)
  if (fieldResponse.error) {
    await locals.supabase.from('solo_concepts').update({ generating: false }).eq('id', conceptData.id)
    console.error('Error generating field:', fieldResponse.error)
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chyba při generování pole: ' + fieldResponse.error.message))
  }
  const generatedContent = fieldResponse.contents[0].text

  // TODO: Regenerate game plan?

  // TODO: Regenerate image?

  // Save generated content
  const { error: updateError } = await locals.supabase.from('solo_concepts').update({ [fieldName]: generatedContent, generating: false }).eq('id', conceptData.id)
  if (updateError) {
    await locals.supabase.from('solo_concepts').update({ generating: false }).eq('id', conceptData.id)
    console.error('Error updating concept:', updateError)
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chyba při ukládání generovaného obsahu: ' + updateError.message))
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
