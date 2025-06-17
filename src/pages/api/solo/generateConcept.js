import { getHash } from '@lib/utils'
import { generateSoloConcept } from '@lib/solo/gemini'

export const POST = async ({ request, locals, redirect }) => {
  const requestData = await request.json()
  const { conceptId } = requestData
  const referer = request.headers.get('referer')
  if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo id konceptu')) }

  const { data: conceptData, error: conceptError } = await locals.supabase.from('solo_concepts').select().eq('id', conceptId).maybeSingle()
  if (conceptError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError.message)) }

  if (conceptData.generating === false) {
    const { error: conceptError2 } = await locals.supabase.from('solo_concepts').update({ generating: true }).eq('id', conceptId)
    if (conceptError2) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError2.message)) }

    try {
      const generatedData = await generateSoloConcept(conceptData)
      if (generatedData.headerImageBuffer) {
        const { error: uploadError } = await locals.supabase.storage.from('headers').upload(`solo-${conceptData.id}.png`, generatedData.headerImageBuffer, { contentType: 'image/jpg' })
        if (uploadError) { console.error('Error uploading image:', uploadError) }
      }

      // Save
      const { error: updateError } = await locals.supabase.from('solo_concepts')
        .update({ generating: false, custom_header: getHash(), generated_world: generatedData.generatedWorld, generated_factions: generatedData.generatedFactions, generated_locations: generatedData.generatedLocations, generated_characters: generatedData.generatedCharacters, generated_protagonist: generatedData.generatedProtagonist, generated_plan: generatedData.generatedPlan, generated_image: generatedData.generatedImage, annotation: generatedData.generatedAnnotation })
        .eq('id', conceptData.id)
      if (updateError) { return new Response(JSON.stringify({ error: updateError.message }), { status: 500 }) }
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    } catch (error) {
      console.error('Error generating concept:', error)
      await locals.supabase.from('solo_concepts').update({ generating: false }).eq('id', conceptData.id)
      return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chyba při generování konceptu: ' + error.message))
    }
  } else {
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Koncept se již generuje'))
  }
}
