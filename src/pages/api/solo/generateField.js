import { getBasePrompt, ai, aiConfig } from '@lib/solo/gemini'

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
function getContext (conceptData, exclude) {
  const context = {
    basePrompt: getBasePrompt(conceptData),
    storyWorld: { text: conceptData.storyWorld },
    storyFactions: { text: conceptData.storyFactions },
    storyLocations: { text: conceptData.storyLocations },
    storyCharacters: { text: conceptData.storyCharacters },
    storyProtagonist: { text: conceptData.storyProtagonist },
    storyAnnotation: { text: conceptData.storyAnnotation },
    storyPlan: { text: conceptData.storyPlan }
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
  const fieldResponse = await ai.models.generateContent(aiConfig)
  if (fieldResponse.error) {
    console.error('Error generating field:', fieldResponse.error)
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chyba při generování pole: ' + fieldResponse.error.message))
  }
  const generatedContent = fieldResponse.contents[0].text

  // Save generated content
  const { error: updateError } = await locals.supabase.from('solo_concepts').update({ [fieldName]: generatedContent, generating: false }).eq('id', conceptData.id)
  if (updateError) {
    console.error('Error updating concept:', updateError)
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chyba při ukládání generovaného obsahu: ' + updateError.message))
  }
  return new Response(JSON.stringify({ success: true, generatedContent }), { status: 200 })
}
