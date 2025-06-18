import { getHash } from '@lib/utils'
import { generateSoloConcept } from '@lib/solo/gemini'

export const POST = async ({ request, locals, redirect }) => {
  let conceptData
  const requestData = await request.json()
  try {
    const { conceptId } = requestData
    const referer = request.headers.get('referer')
    if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo id konceptu')) }

    const { data: dbData, error: conceptError } = await locals.supabase.from('solo_concepts').select().eq('id', conceptId).maybeSingle()
    if (conceptError) { throw new Error(conceptError.message) }
    conceptData = dbData

    if (conceptData.generating === false) {
      const { error: conceptError2 } = await locals.supabase.from('solo_concepts').update({ generating: true, generated_world: 'generating', generated_factions: 'generating', generated_locations: 'generating', generated_characters: 'generating', generated_protagonist: 'generating', generated_plan: 'generating', generated_image: 'generating', annotation: 'generating' }).eq('id', conceptId)
      if (conceptError2) { throw new Error(conceptError2.message) }

      const { data: generatedData, error: generationError } = await generateSoloConcept(conceptData)
      if (generationError) { throw new Error(generationError.message) }
      if (generatedData.headerImageBuffer) {
        const { error: uploadError } = await locals.supabase.storage.from('headers').upload(`solo-${conceptData.id}.png`, generatedData.headerImageBuffer, { contentType: 'image/jpg' })
        if (uploadError) { throw new Error(uploadError.message) }
      }

      // Save
      const { error: updateError } = await locals.supabase.from('solo_concepts')
        .update({ generating: false, published: true, custom_header: getHash(), generated_world: generatedData.generatedWorld, generated_factions: generatedData.generatedFactions, generated_locations: generatedData.generatedLocations, generated_characters: generatedData.generatedCharacters, generated_protagonist: generatedData.generatedProtagonist, generated_plan: generatedData.generatedPlan, generated_image: generatedData.generatedImage, annotation: generatedData.generatedAnnotation })
        .eq('id', conceptData.id)
      if (updateError) { throw new Error(updateError.message) }

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    } else {
      return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Koncept se již generuje'))
    }
  } catch (error) {
    console.error('Error in generateConcept API:', error)
    await locals.supabase.from('solo_concepts').update({ generating: false }).eq('id', conceptData.id)
    return new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 })
  }
}
