import { getAI } from '@lib/solo/server-moonshot'
import { getStamp } from '@lib/utils'
import { generateImage } from '@lib/solo/server-replicate'
import { getPrompts, assistantInstructions } from '@lib/solo/solo'

async function generateConcept (locals, params, sendEvent) {
  const { id, name, world, factions, locations, characters, protagonist, promptHeaderImage, promptStorytellerImage, plan, generating = [] } = params
  console.log('generating', generating)

  try {
    const env = locals.runtime.env
    const ai = getAI(env)
    const basePrompt = `Hra kterou připravujeme se jmenuje "${decodeURIComponent(name)}"`

    const { data: existingData } = await locals.supabase.from('solo_concepts').select('generated_world, generated_factions, generated_locations, generated_characters, generated_protagonist, abilities, generating').eq('id', id).single()
    const currentGenerating = [...(existingData.generating || [])]
    const prompts = getPrompts(existingData)

    const messages = [
      { role: 'system', content: assistantInstructions },
      { role: 'user', content: basePrompt }
    ]

    async function ask (prompt) {
      messages.push({ role: 'user', content: prompt })
      const res = await ai.chat.completions.create({ model: 'kimi-k2-0711-preview', messages })
      const text = res.choices[0].message.content
      messages.push({ role: 'assistant', content: text })
      return text
    }

    let responseWorld, responseFactions, responseLocations, responseCharacters, responseProtagonist, responseHeaderImagePrompt, responseStorytellerImagePrompt, npcData

    // World
    if (currentGenerating.includes('generated_world')) {
      sendEvent('progress', { step: 'generated_world', message: 'Generuji svět...' })
      let promptWorld = prompts.prompt_world
      if (world) { promptWorld += `Vypravěč uvedl toto zadání: "${world}"` }
      const worldText = await ask(promptWorld)
      currentGenerating.splice(currentGenerating.indexOf('generated_world'), 1)
      const { error: updateErrorWorld } = await locals.supabase.from('solo_concepts').update({ generated_world: worldText, generating: currentGenerating }).eq('id', id)
      if (updateErrorWorld) { throw new Error(updateErrorWorld.message) }
      sendEvent('step_complete', { step: 'generated_world', generating: currentGenerating })
      responseWorld = { text: worldText }
    } else {
      messages.push({ role: 'user', content: prompts.prompt_world })
      messages.push({ role: 'assistant', content: existingData.generated_world })
      responseWorld = { text: existingData.generated_world }
    }

    // Factions
    if (currentGenerating.includes('generated_factions')) {
      sendEvent('progress', { step: 'generated_factions', message: 'Generuji frakce...' })
      let promptFactions = prompts.prompt_factions
      if (factions) { promptFactions += `Vypravěč uvedl toto zadání: "${factions}"` }
      const factionsText = await ask(promptFactions)
      currentGenerating.splice(currentGenerating.indexOf('generated_factions'), 1)
      const { error: updateErrorFactions } = await locals.supabase.from('solo_concepts').update({ generated_factions: factionsText, generating: currentGenerating }).eq('id', id)
      if (updateErrorFactions) { throw new Error(updateErrorFactions.message) }
      sendEvent('step_complete', { step: 'generated_factions', generating: currentGenerating })
      responseFactions = { text: factionsText }
    } else {
      messages.push({ role: 'user', content: prompts.prompt_factions })
      messages.push({ role: 'assistant', content: existingData.generated_factions })
      responseFactions = { text: existingData.generated_factions }
    }

    // Locations
    if (currentGenerating.includes('generated_locations')) {
      sendEvent('progress', { step: 'generated_locations', message: 'Generuji místa...' })
      let promptLocations = prompts.prompt_locations
      if (locations) { promptLocations += `Vypravěč uvedl toto zadání: "${locations}"` }
      const locationsText = await ask(promptLocations)
      currentGenerating.splice(currentGenerating.indexOf('generated_locations'), 1)
      const { error: updateErrorLocations } = await locals.supabase.from('solo_concepts').update({ generated_locations: locationsText, generating: currentGenerating }).eq('id', id)
      if (updateErrorLocations) { throw new Error(updateErrorLocations.message) }
      sendEvent('step_complete', { step: 'generated_locations', generating: currentGenerating })
      responseLocations = { text: locationsText }
    } else {
      messages.push({ role: 'user', content: prompts.prompt_locations })
      messages.push({ role: 'assistant', content: existingData.generated_locations })
      responseLocations = { text: existingData.generated_locations }
    }

    // Characters
    if (currentGenerating.includes('generated_characters')) {
      sendEvent('progress', { step: 'generated_characters', message: 'Generuji postavy...' })
      let promptCharacters = prompts.prompt_characters
      if (characters) { promptCharacters += `Vypravěč uvedl toto zadání: "${characters}"` }
      const charactersText = await ask(promptCharacters)
      currentGenerating.splice(currentGenerating.indexOf('generated_characters'), 1)
      const { error: updateErrorCharacters } = await locals.supabase.from('solo_concepts').update({ generated_characters: charactersText, generating: currentGenerating }).eq('id', id)
      if (updateErrorCharacters) { throw new Error(updateErrorCharacters.message) }
      sendEvent('step_complete', { step: 'generated_characters', generating: currentGenerating })
      responseCharacters = { text: charactersText }
    } else {
      messages.push({ role: 'user', content: prompts.prompt_characters })
      messages.push({ role: 'assistant', content: existingData.generated_characters })
      responseCharacters = { text: existingData.generated_characters }
    }

    // Protagonist
    if (currentGenerating.includes('generated_protagonist')) {
      sendEvent('progress', { step: 'generated_protagonist', message: 'Generuji protagonistu...' })
      let promptProtagonist = prompts.prompt_protagonist
      if (protagonist) { promptProtagonist += `Vypravěč uvedl toto zadání: "${protagonist}"` }
      const protagonistText = await ask(promptProtagonist)
      currentGenerating.splice(currentGenerating.indexOf('generated_protagonist'), 1)
      const { error: updateErrorProtagonist } = await locals.supabase.from('solo_concepts').update({ generated_protagonist: protagonistText, generating: currentGenerating }).eq('id', id)
      if (updateErrorProtagonist) { throw new Error(updateErrorProtagonist.message) }
      sendEvent('step_complete', { step: 'generated_protagonist', generating: currentGenerating })
      responseProtagonist = { text: protagonistText }
    } else {
      messages.push({ role: 'user', content: prompts.prompt_protagonist })
      messages.push({ role: 'assistant', content: existingData.generated_protagonist })
      responseProtagonist = { text: existingData.generated_protagonist }
    }

    // Annotation
    if (currentGenerating.includes('annotation')) {
      sendEvent('progress', { step: 'annotation', message: 'Generuji anotaci...' })
      const annotationText = await ask(prompts.annotation)
      currentGenerating.splice(currentGenerating.indexOf('annotation'), 1)
      const { error: updateErrorAnnotation } = await locals.supabase.from('solo_concepts').update({ annotation: annotationText, generating: currentGenerating }).eq('id', id)
      if (updateErrorAnnotation) { throw new Error(updateErrorAnnotation.message) }
      sendEvent('step_complete', { step: 'annotation', generating: currentGenerating })
    }

    // Header image prompt
    if (currentGenerating.includes('generated_header_image')) {
      sendEvent('progress', { step: 'generated_header_image', message: 'Generuji popis obrázku hlavičky...' })
      let headerImagePrompt = prompts.prompt_header_image
      if (promptHeaderImage) { headerImagePrompt += `Vypravěč uvedl toto zadání: "${promptHeaderImage}"` }
      const headerText = await ask(headerImagePrompt)
      currentGenerating.splice(currentGenerating.indexOf('generated_header_image'), 1)
      const { error: updateErrorImage } = await locals.supabase.from('solo_concepts').update({ generated_header_image: headerText, generating: currentGenerating }).eq('id', id)
      if (updateErrorImage) { throw new Error(updateErrorImage.message) }
      sendEvent('step_complete', { step: 'generated_header_image', generating: currentGenerating })
      responseHeaderImagePrompt = { text: headerText }
    } else {
      const { data } = await locals.supabase.from('solo_concepts').select('generated_header_image').eq('id', id).single()
      responseHeaderImagePrompt = { text: data.generated_header_image }
    }

    // Storyteller image prompt
    if (currentGenerating.includes('generated_storyteller_image')) {
      sendEvent('progress', { step: 'generated_storyteller_image', message: 'Generuji popis obrázku vypravěče...' })
      let storytellerImagePrompt = prompts.prompt_storyteller_image
      if (promptStorytellerImage) { storytellerImagePrompt += `Vypravěč uvedl toto zadání: "${promptStorytellerImage}"` }
      const storytellerText = await ask(storytellerImagePrompt)
      currentGenerating.splice(currentGenerating.indexOf('generated_storyteller_image'), 1)
      const { error: updateErrorStorytellerImage } = await locals.supabase.from('solo_concepts').update({ generated_storyteller_image: storytellerText, generating: currentGenerating }).eq('id', id)
      if (updateErrorStorytellerImage) { throw new Error(updateErrorStorytellerImage.message) }
      sendEvent('step_complete', { step: 'generated_storyteller_image', generating: currentGenerating })
      responseStorytellerImagePrompt = { text: storytellerText }
    } else {
      const { data } = await locals.supabase.from('solo_concepts').select('generated_storyteller_image').eq('id', id).single()
      responseStorytellerImagePrompt = { text: data.generated_storyteller_image }
    }

    // Add storyteller npc if not exists
    const { data: existingNpc } = await locals.supabase.from('solo_concepts').select('storyteller').eq('id', id).single()
    if (!existingNpc.storyteller) {
      const gameSlug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '')
      const npc = { name: 'Vypravěč', slug: `vypravec-${gameSlug}`, solo_concept: id, storyteller: true, created_at: new Date(), portrait: getStamp() }
      const { data: npcDataResult, error: npcError } = await locals.supabase.from('npcs').insert(npc).select().single()
      if (npcError) { throw new Error(npcError.message) }
      npcData = npcDataResult
    } else {
      const { data: npcDataResult } = await locals.supabase.from('npcs').select().eq('id', existingNpc.storyteller).single()
      npcData = npcDataResult
    }

    // Header image
    if (currentGenerating.includes('header_image')) {
      sendEvent('progress', { step: 'header_image', message: 'Generuji obrázek hlavičky...' })
      const { data: headerImage, error: headerImageError } = await generateImage(env, responseHeaderImagePrompt.text, 'header')
      if (headerImageError) { throw new Error(headerImageError.message) }
      if (headerImage) {
        const { error: headerUploadError } = await locals.supabase.storage.from('headers').upload(`solo-${id}.jpg`, headerImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: responseHeaderImagePrompt.text } })
        if (headerUploadError) { throw new Error(headerUploadError.message) }
      }
      currentGenerating.splice(currentGenerating.indexOf('header_image'), 1)
      const { error: updateHeaderImageError } = await locals.supabase.from('solo_concepts').update({ generating: currentGenerating }).eq('id', id)
      if (updateHeaderImageError) { throw new Error(updateHeaderImageError.message) }
      sendEvent('step_complete', { step: 'header_image', generating: currentGenerating })
    }

    // Storyteller image
    if (currentGenerating.includes('storyteller_image')) {
      sendEvent('progress', { step: 'storyteller_image', message: 'Generuji obrázek vypravěče...' })
      const { data: storytellerImage, error: storytellerImageError } = await generateImage(env, responseStorytellerImagePrompt.text, 'npc')
      if (storytellerImageError) { throw new Error(storytellerImageError.message) }
      if (storytellerImage) {
        const { error: storytellerUploadError } = await locals.supabase.storage.from('portraits').upload(`${npcData.id}.jpg`, storytellerImage, { contentType: 'image/jpg', upsert: true, metadata: { prompt: responseStorytellerImagePrompt.text } })
        if (storytellerUploadError) { throw new Error(storytellerUploadError.message) }
      }
      currentGenerating.splice(currentGenerating.indexOf('storyteller_image'), 1)
      const { error: updateStorytellerImageError } = await locals.supabase.from('solo_concepts').update({ generating: currentGenerating }).eq('id', id)
      if (updateStorytellerImageError) { throw new Error(updateStorytellerImageError.message) }
      sendEvent('step_complete', { step: 'storyteller_image', generating: currentGenerating })
    }

    // Protagonist names
    if (currentGenerating.includes('protagonist_names')) {
      sendEvent('progress', { step: 'protagonist_names', message: 'Generuji jména pro postavu...' })
      const protagonistContents = `Následující text popisuje setting pro TTRPG hru pod názvem "${name}":\n${responseWorld.text}\n${responseProtagonist.text}\n${prompts.protagonist_names}\nOdpověz ve formátu JSON pole řetězců.`
      const protagonistNamesResponse = await ai.chat.completions.create({ model: 'kimi-k2-0711-preview', messages: [{ role: 'system', content: assistantInstructions }, { role: 'user', content: protagonistContents }] })
      currentGenerating.splice(currentGenerating.indexOf('protagonist_names'), 1)
      const { error: updateErrorProtagonistNames } = await locals.supabase.from('solo_concepts').update({ protagonist_names: JSON.parse(protagonistNamesResponse.choices[0].message.content), generating: currentGenerating }).eq('id', id)
      if (updateErrorProtagonistNames) { throw new Error(updateErrorProtagonistNames.message) }
      sendEvent('step_complete', { step: 'protagonist_names', generating: currentGenerating })
    }

    // Abilities
    if (currentGenerating.includes('abilities')) {
      sendEvent('progress', { step: 'abilities', message: 'Generuji schopnosti...' })
      const abilitiesContents = `Následující text popisuje setting pro TTRPG hru pod názvem "${name}":\n${responseWorld.text}\n${responseProtagonist.text}\n${prompts.abilities}\nOdpověz ve formátu JSON pole řetězců.`
      const abilitiesResponse = await ai.chat.completions.create({ model: 'kimi-k2-0711-preview', messages: [{ role: 'system', content: assistantInstructions }, { role: 'user', content: abilitiesContents }] })
      currentGenerating.splice(currentGenerating.indexOf('abilities'), 1)
      const { error: updateErrorAbilities } = await locals.supabase.from('solo_concepts').update({ abilities: JSON.parse(abilitiesResponse.choices[0].message.content), generating: currentGenerating }).eq('id', id)
      if (updateErrorAbilities) { throw new Error(updateErrorAbilities.message) }
      sendEvent('step_complete', { step: 'abilities', generating: currentGenerating })
    }

    // Inventory
    if (currentGenerating.includes('inventory')) {
      sendEvent('progress', { step: 'inventory', message: 'Generuji inventář...' })
      const inventoryContents = `Následující text popisuje setting pro TTRPG hru pod názvem "${name}":\n${responseWorld.text}\n${responseProtagonist.text}\n${prompts.inventory}\nOdpověz ve formátu JSON pole řetězců.`
      const inventoryResponse = await ai.chat.completions.create({ model: 'kimi-k2-0711-preview', messages: [{ role: 'system', content: assistantInstructions }, { role: 'user', content: inventoryContents }] })
      currentGenerating.splice(currentGenerating.indexOf('inventory'), 1)
      const { error: updateErrorInventory } = await locals.supabase.from('solo_concepts').update({ inventory: JSON.parse(inventoryResponse.choices[0].message.content), generating: currentGenerating }).eq('id', id)
      if (updateErrorInventory) { throw new Error(updateErrorInventory.message) }
      sendEvent('step_complete', { step: 'inventory', generating: currentGenerating })
    }

    // Plan
    if (currentGenerating.includes('generated_plan')) {
      sendEvent('progress', { step: 'generated_plan', message: 'Generuji příběh...' })
      const planParts = [`Následující text popisuje setting pro TTRPG hru pod názvem "${name}":`, responseWorld.text, responseFactions.text, responseLocations.text, responseCharacters.text, responseProtagonist.text, prompts.prompt_plan]
      if (plan) { planParts.push(`Vypravěč uvedl toto zadání: "${plan}"`) }
      const planPrompt = planParts.join('\n')
      const planResponse = await ai.chat.completions.create({ model: 'kimi-k2-0711-preview', messages: [{ role: 'system', content: assistantInstructions }, { role: 'user', content: planPrompt }] })
      const generatedPlan = planResponse.choices[0].message.content
      currentGenerating.splice(currentGenerating.indexOf('generated_plan'), 1)
      const { error: updateErrorPlan } = await locals.supabase.from('solo_concepts').update({ generated_plan: generatedPlan, generating: currentGenerating }).eq('id', id)
      if (updateErrorPlan) { throw new Error(updateErrorPlan.message) }
      sendEvent('step_complete', { step: 'generated_plan', generating: currentGenerating })
    }

    const { error: updateError } = await locals.supabase.from('solo_concepts').update({ published: true, generating: [], custom_header: getStamp(), storyteller: npcData.id, generation_error: '' }).eq('id', id)
    if (updateError) { throw new Error(updateError.message) }
    console.log('Generation completed successfully for concept:', id)
  } catch (error) {
    console.error('Error in generateConcept:', error)
    await locals.supabase.from('solo_concepts').update({ generating: [], generation_error: error.message }).eq('id', id)
    throw error
  }
}

export const GET = async ({ locals }) => {
  return new Response('OK:' + locals.runtime.env.MOONSHOT_API_KEY, { status: 200 })
}

export const POST = async ({ request, locals }) => {
  console.log('Generating solo concept via SSE...')
  const data = await request.json()
  const { id, author, name } = data

  if (!id || !author || !name) {
    console.error('Missing required fields for solo concept generation:', { id, author, name })
    return new Response(JSON.stringify({ error: { message: 'Některé povinné údaje chybí' } }), { status: 400 })
  }

  const { error: startError } = await locals.supabase.from('solo_concepts').update({ generation_error: '' }).eq('id', id)
  if (startError) {
    console.error('Error starting generation:', startError.message)
    return new Response(JSON.stringify({ error: { message: 'Error starting generation: ' + startError.message } }), { status: 500 })
  }

  const stream = new ReadableStream({
    async start (controller) {
      const encoder = new TextEncoder()

      const sendEvent = (eventType, data) => {
        const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      try {
        sendEvent('start', { status: 'Generation started' })

        await generateConcept(locals, data, sendEvent)

        sendEvent('complete', { status: 'Generation completed' })
        controller.close()
      } catch (error) {
        console.error('Error in SSE generation:', error)
        sendEvent('error', { message: error.message })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      Connection: 'keep-alive'
    }
  })
}

