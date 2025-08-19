import { generateImage } from '@lib/solo/server-replicate'
import { getStamp } from '@lib/utils'
import { getAI } from '@lib/solo/server-moonshot'
import { getPrompts, getContext, fieldNames, assistantInstructions } from '@lib/solo/solo'

// Generate content of a single field of a solo game concept
export const POST = async ({ request, locals, redirect }) => {
  try {
    const { conceptId, field, value } = await request.json()
    if (!locals.user.id || !conceptId || !field) { return redirect(request.headers.get('referer') + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo data o konceptu')) }
    const ai = getAI(locals.runtime.env)

    // Save updated field data, mark concept as generating and load current concept data
    const updatedConcept = { generating: [field] }
    if (typeof value === 'string' && field !== 'protagonist_names' && field !== 'inventory' && field !== 'abilities') { updatedConcept[field] = value }
    const { data: conceptData, error: markingError } = await locals.supabase.from('solo_concepts').update(updatedConcept).eq('id', conceptId).select().single()
    if (markingError) { throw new Error(markingError.message) }

    const prompts = getPrompts(conceptData)
    const systemContent = `${assistantInstructions}${getContext(conceptData, field, null, conceptData.inventory, conceptData.abilities)}`
    let userContent = prompts[field]
    if (value) { userContent += `\nVypravěč uvedl toto zadání: "${value}"` }

    const messages = [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ]

    const response = await ai.chat.completions.create({ model: 'kimi-k2-0711-preview', messages })

    const newData = { generating: [] }
    const target = field.replace('prompt_', 'generated_')
    newData[target] = ['protagonist_names', 'inventory', 'abilities'].includes(field) ? JSON.parse(response.choices[0].message.content) : response.choices[0].message.content

    // Update game plan if needed
    if (['prompt_world', 'prompt_factions', 'prompt_locations', 'prompt_characters', 'prompt_protagonist', 'prompt_plan'].includes(field)) {
      let prompt = prompts.prompt_plan
      if (field !== 'prompt_plan') {
        prompt = `${fieldNames[field]}: ${newData[target]}\n\n${prompts.prompt_plan}`
      }
      if (conceptData.prompt_plan) { prompt += `\nVypravěč uvedl toto zadání: "${conceptData.prompt_plan}"` }
      const planResponse = await ai.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages: [
          { role: 'system', content: assistantInstructions },
          { role: 'user', content: prompt }
        ]
      })
      newData.generated_plan = planResponse.choices[0].message.content
    }

    // Update header image if requested
    if (field === 'prompt_header_image') {
      const { data: headerImage, error: imageError } = await generateImage(locals.runtime.env, newData.generated_header_image, 'header')
      if (imageError) { throw new Error(imageError.message) }
      if (headerImage) {
        const { error: headerUploadError } = await locals.supabase.storage.from('headers').upload(`solo-${conceptData.id}.jpg`, headerImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: newData.generated_header_image } })
        if (headerUploadError) { throw new Error(headerUploadError.message) }
        newData.custom_header = getStamp()
      }
    }

    // Update storyteller image if requested
    if (field === 'prompt_storyteller_image') {
      const { data: storytellerImage, error: imageError } = await generateImage(locals.runtime.env, newData.generated_storyteller_image, 'npc')
      if (imageError) { throw new Error(imageError.message) }
      if (storytellerImage) {
        const { error: storytellerUploadError } = await locals.supabase.storage.from('portraits').upload(`${conceptData.storyteller}.jpg`, storytellerImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: newData.generated_storyteller_image } })
        if (storytellerUploadError) { throw new Error(storytellerUploadError.message) }
        const { error: storytellerUpdateError } = await locals.supabase.from('npcs').update({ portrait: getStamp() }).eq('id', conceptData.storyteller)
        if (storytellerUpdateError) { throw new Error(storytellerUpdateError.message) }
      }
    }

    // Save generated content
    const { error: updateError } = await locals.supabase.from('solo_concepts').update(newData).eq('id', conceptData.id)
    if (updateError) { throw new Error(updateError.message) }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error in generateField API:', error)
    await locals.supabase.from('solo_concepts').update({ generating: [] }).eq('id', await request.json().conceptId)
    return new Response(JSON.stringify({ error: { message: 'Chyba při generování pole: ' + error.message } }), { status: 500 })
  }
}

