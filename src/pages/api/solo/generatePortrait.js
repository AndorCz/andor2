import { getStamp } from '@lib/utils'
import { generateImage } from '@lib/solo/server-replicate'

// Generate content of a single field of a solo game concept
export const POST = async ({ request, locals, redirect }) => {
  try {
    const { gameId } = await request.json()
    if (!locals.user.id || !gameId) { return redirect(request.headers.get('referer') + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo id hry')) }

    const { data: characterData, error: characterError } = await locals.supabase.from('characters').select().eq('solo_game', gameId).select().single()
    if (characterError) { throw new Error(characterError.message) }

    const { data: portraitImage, error: portraitError } = await generateImage(locals.runtime.env, characterData.portrait_prompt, 'npc')
    if (portraitError) { throw new Error('Chyba při generování portrétu postavy: ' + portraitError.message) }
    if (portraitImage) {
      const { error: uploadError } = await locals.supabase.storage.from('portraits').upload(`${characterData.id}.jpg`, portraitImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: characterData.portrait_prompt } })
      if (uploadError) { throw new Error('Chyba při nahrávání portrétu: ' + uploadError.message) }
    }

    const { error: characterEditError } = await locals.supabase.from('characters').update({ portrait: getStamp() }).eq('solo_game', gameId)
    if (characterEditError) { throw new Error(characterEditError.message) }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error in generatePortrait API:', error)
    return new Response(JSON.stringify({ error: { message: 'Chyba při generování portrétu: ' + error.message } }), { status: 500 })
  }
}
