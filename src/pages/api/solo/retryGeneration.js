import { generateSoloConcept } from '@lib/solo/server-gemini'

export const POST = async ({ request, locals }) => {
  try {
    const { conceptId } = await request.json()
    if (!locals.user?.id || !conceptId) {
      return new Response(JSON.stringify({ error: { message: 'Chybí přihlášení nebo ID konceptu' } }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Reset the concept to generating state and clear any partial data
    const columns = ['annotation', 'generated_world', 'generated_factions', 'generated_locations', 'generated_characters', 'generated_protagonist', 'generated_header_image', 'generated_storyteller_image', 'generated_plan', 'protagonist_names', 'inventory', 'header_image', 'storyteller_image']
    const { data: conceptData, error: resetError } = await locals.supabase.from('solo_concepts').update({ generating: columns }).eq('id', conceptId).select().single()
    if (resetError) { return new Response(JSON.stringify({ error: { message: 'Chyba při resetování konceptu: ' + resetError.message } }), { status: 500, headers: { 'Content-Type': 'application/json' } }) }

    // Start generation process (fire and forget)
    generateSoloConcept(locals.runtime.env, locals.supabase, conceptData)

    return new Response(JSON.stringify({ success: true, message: 'Generování bylo znovu spuštěno' }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Error in retry generation:', error)
    return new Response(JSON.stringify({ error: { message: 'Chyba při opakování generování: ' + error.message } }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
