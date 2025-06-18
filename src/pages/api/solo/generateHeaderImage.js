import { getHash } from '@lib/utils'
import { generateHeaderImage } from '@lib/solo/gemini'

export const POST = async ({ request, locals, redirect }) => {
  const requestData = await request.json()
  const { conceptId, imagePrompt } = requestData
  const referer = request.headers.get('referer')
  if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }

  const { data: conceptData, error: conceptError } = await locals.supabase.from('solo_concepts').select().eq('id', conceptId).maybeSingle()
  if (conceptError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError.message)) }

  const { image, error: imageError } = await generateHeaderImage({ text: imagePrompt })
  if (imageError) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(imageError.message)) }

  const { error: uploadError } = await locals.supabase.storage
    .from('headers')
    .upload(`solo-${conceptData.id}.png`, image, { contentType: 'image/jpg' })
  if (uploadError) { console.error('Error uploading image:', uploadError) }

  // Save
  const { error: updateError } = await locals.supabase.from('solo_concepts').update({ generating: false, custom_header: getHash() }).eq('id', conceptData.id)
  if (updateError) { return new Response(JSON.stringify({ error: updateError.message }), { status: 500 }) }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
