import { Type } from '@google/genai'
import { getHash } from '@lib/utils'
import { generateImage } from '@lib/solo/server-aiml'

import { getAI, assistantParams, assistantInstructions, prompts, imageParams } from '@lib/solo/server-gemini'

async function generateConcept (locals, params) {
  const { id, name, world, factions, locations, characters, protagonist, promptHeaderImage, promptStorytellerImage, plan, generating = [] } = params
  console.log('generating', generating)

  try {
    const env = locals.runtime.env
    const ai = getAI(env)
    const structuredConfig = { config: { responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }, responseMimeType: 'application/json' } }
    const basePrompt = { text: `Hra kterou připravujeme se jmenuje "${decodeURIComponent(name)}"` }

    // Load existing data for chat history
    const { data: existingData } = await locals.supabase.from('solo_concepts').select('generated_world, generated_factions, generated_locations, generated_characters, generated_protagonist').eq('id', id).single()

    // Build chat history with previous responses
    const history = [{ role: 'user', parts: [{ text: assistantInstructions }, basePrompt] }]
    if (existingData.generated_world) { history.push({ role: 'model', parts: [{ text: existingData.generated_world }] }) }
    if (existingData.generated_factions) { history.push({ role: 'model', parts: [{ text: existingData.generated_factions }] }) }
    if (existingData.generated_locations) { history.push({ role: 'model', parts: [{ text: existingData.generated_locations }] }) }
    if (existingData.generated_characters) { history.push({ role: 'model', parts: [{ text: existingData.generated_characters }] }) }
    if (existingData.generated_protagonist) { history.push({ role: 'model', parts: [{ text: existingData.generated_protagonist }] }) }

    const chat = ai.chats.create({ ...assistantParams, history })

    let responseWorld, responseFactions, responseLocations, responseCharacters, responseProtagonist, responseHeaderImagePrompt, responseStorytellerImagePrompt, npcData

    // World
    if (generating.includes('generated_world')) {
      const promptWorld = { text: prompts.prompt_world }
      if (world) { promptWorld.text += `Vypravěč uvedl toto zadání: "${world}"` }
      responseWorld = await chat.sendMessage({ message: promptWorld })
      generating.splice(generating.indexOf('generated_world'), 1)
      const { error: updateErrorWorld } = await locals.supabase.from('solo_concepts').update({ generated_world: responseWorld.text, generating }).eq('id', id)
      if (updateErrorWorld) { throw new Error(updateErrorWorld.message) }
    } else {
      responseWorld = { text: existingData.generated_world }
    }

    // Factions
    if (generating.includes('generated_factions')) {
      const promptFactions = { text: prompts.prompt_factions }
      if (factions) { promptFactions.text += `Vypravěč uvedl toto zadání: "${factions}"` }
      responseFactions = await chat.sendMessage({ message: promptFactions })
      generating.splice(generating.indexOf('generated_factions'), 1)
      const { error: updateErrorFactions } = await locals.supabase.from('solo_concepts').update({ generated_factions: responseFactions.text, generating }).eq('id', id)
      if (updateErrorFactions) { throw new Error(updateErrorFactions.message) }
    } else {
      responseFactions = { text: existingData.generated_factions }
    }

    // Locations
    if (generating.includes('generated_locations')) {
      const promptLocations = { text: prompts.prompt_locations }
      if (locations) { promptLocations.text += `Vypravěč uvedl toto zadání: "${locations}"` }
      responseLocations = await chat.sendMessage({ message: promptLocations })
      generating.splice(generating.indexOf('generated_locations'), 1)
      const { error: updateErrorLocations } = await locals.supabase.from('solo_concepts').update({ generated_locations: responseLocations.text, generating }).eq('id', id)
      if (updateErrorLocations) { throw new Error(updateErrorLocations.message) }
    } else {
      responseLocations = { text: existingData.generated_locations }
    }

    // Characters
    if (generating.includes('generated_characters')) {
      const promptCharacters = { text: prompts.prompt_characters }
      if (characters) { promptCharacters.text += `Vypravěč uvedl toto zadání: "${characters}"` }
      responseCharacters = await chat.sendMessage({ message: promptCharacters })
      generating.splice(generating.indexOf('generated_characters'), 1)
      const { error: updateErrorCharacters } = await locals.supabase.from('solo_concepts').update({ generated_characters: responseCharacters.text, generating }).eq('id', id)
      if (updateErrorCharacters) { throw new Error(updateErrorCharacters.message) }
    } else {
      responseCharacters = { text: existingData.generated_characters }
    }

    // Protagonist
    if (generating.includes('generated_protagonist')) {
      const promptProtagonist = { text: prompts.prompt_protagonist }
      if (protagonist) { promptProtagonist.text += `Vypravěč uvedl toto zadání: "${protagonist}"` }
      responseProtagonist = await chat.sendMessage({ message: promptProtagonist })
      generating.splice(generating.indexOf('generated_protagonist'), 1)
      const { error: updateErrorProtagonist } = await locals.supabase.from('solo_concepts').update({ generated_protagonist: responseProtagonist.text, generating }).eq('id', id)
      if (updateErrorProtagonist) { throw new Error(updateErrorProtagonist.message) }
    } else {
      responseProtagonist = { text: existingData.generated_protagonist }
    }

    // Annotation
    if (generating.includes('annotation')) {
      const responseAnnotation = await chat.sendMessage({ message: prompts.annotation })
      generating.splice(generating.indexOf('annotation'), 1)
      const { error: updateErrorAnnotation } = await locals.supabase.from('solo_concepts').update({ annotation: responseAnnotation.text, generating }).eq('id', id)
      if (updateErrorAnnotation) { throw new Error(updateErrorAnnotation.message) }
    }

    // Header image prompt
    if (generating.includes('generated_header_image')) {
      const headerImagePrompt = { text: prompts.prompt_header_image }
      if (promptHeaderImage) { headerImagePrompt.text += `Vypravěč uvedl toto zadání: "${promptHeaderImage}"` }
      responseHeaderImagePrompt = await chat.sendMessage({ message: headerImagePrompt })
      generating.splice(generating.indexOf('generated_header_image'), 1)
      const { error: updateErrorImage } = await locals.supabase.from('solo_concepts').update({ generated_header_image: responseHeaderImagePrompt.text, generating }).eq('id', id)
      if (updateErrorImage) { throw new Error(updateErrorImage.message) }
    } else {
      const { data } = await locals.supabase.from('solo_concepts').select('generated_header_image').eq('id', id).single()
      responseHeaderImagePrompt = { text: data.generated_header_image }
    }

    // Storyteller image prompt
    if (generating.includes('generated_storyteller_image')) {
      const storytellerImagePrompt = { text: prompts.prompt_storyteller_image }
      if (promptStorytellerImage) { storytellerImagePrompt.text += `Vypravěč uvedl toto zadání: "${promptStorytellerImage}"` }
      responseStorytellerImagePrompt = await chat.sendMessage({ message: storytellerImagePrompt })
      generating.splice(generating.indexOf('generated_storyteller_image'), 1)
      const { error: updateErrorStorytellerImage } = await locals.supabase.from('solo_concepts').update({ generated_storyteller_image: responseStorytellerImagePrompt.text, generating }).eq('id', id)
      if (updateErrorStorytellerImage) { throw new Error(updateErrorStorytellerImage.message) }
    } else {
      const { data } = await locals.supabase.from('solo_concepts').select('generated_storyteller_image').eq('id', id).single()
      responseStorytellerImagePrompt = { text: data.generated_storyteller_image }
    }

    // Add storyteller npc if not exists
    const { data: existingNpc } = await locals.supabase.from('solo_concepts').select('storyteller').eq('id', id).single()
    if (!existingNpc.storyteller) {
      const gameSlug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '')
      const npc = { name: 'Vypravěč', slug: `vypravec-${gameSlug}`, solo_concept: id, storyteller: true, created_at: new Date(), portrait: getHash() }
      const { data: npcDataResult, error: npcError } = await locals.supabase.from('npcs').insert(npc).select().single()
      if (npcError) { throw new Error(npcError.message) }
      npcData = npcDataResult
    } else {
      const { data: npcDataResult } = await locals.supabase.from('npcs').select().eq('id', existingNpc.storyteller).single()
      npcData = npcDataResult
    }

    // Header image
    if (generating.includes('header_image')) {
      const { data: headerImage, error: headerImageError } = await generateImage(env, responseHeaderImagePrompt.text, imageParams.header)
      if (headerImageError) { throw new Error(headerImageError.message) }
      if (headerImage) {
        const { error: headerUploadError } = await locals.supabase.storage.from('headers').upload(`solo-${id}.jpg`, headerImage, { contentType: 'image/jpg', upsert: true })
        if (headerUploadError) { throw new Error(headerUploadError.message) }
      }
      generating.splice(generating.indexOf('header_image'), 1)
      const { error: updateHeaderImageError } = await locals.supabase.from('solo_concepts').update({ generating }).eq('id', id)
      if (updateHeaderImageError) { throw new Error(updateHeaderImageError.message) }
    }

    // Storyteller image
    if (generating.includes('storyteller_image')) {
      const { data: storytellerImage, error: storytellerImageError } = await generateImage(env, responseStorytellerImagePrompt.text, imageParams.npc)
      if (storytellerImageError) { throw new Error(storytellerImageError.message) }
      if (storytellerImage) {
        const { error: storytellerUploadError } = await locals.supabase.storage.from('portraits').upload(`${npcData.id}.jpg`, storytellerImage, { contentType: 'image/jpg', upsert: true })
        if (storytellerUploadError) { throw new Error(storytellerUploadError.message) }
      }
      generating.splice(generating.indexOf('storyteller_image'), 1)
      const { error: updateStorytellerImageError } = await locals.supabase.from('solo_concepts').update({ generating }).eq('id', id)
      if (updateStorytellerImageError) { throw new Error(updateStorytellerImageError.message) }
    }

    // Protagonist names
    if (generating.includes('protagonist_names')) {
      const protagonistContents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${name}":` }, { text: responseWorld.text }, { text: responseProtagonist.text }, { text: prompts.protagonist_names }]
      const protagonistNamesResponse = await ai.models.generateContent({ ...assistantParams, ...structuredConfig, contents: protagonistContents })
      generating.splice(generating.indexOf('protagonist_names'), 1)
      const { error: updateErrorProtagonistNames } = await locals.supabase.from('solo_concepts').update({ protagonist_names: JSON.parse(protagonistNamesResponse.text), generating }).eq('id', id)
      if (updateErrorProtagonistNames) { throw new Error(updateErrorProtagonistNames.message) }
    }

    // Inventory
    if (generating.includes('inventory')) {
      const inventoryContents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${name}":` }, { text: responseWorld.text }, { text: responseProtagonist.text }, { text: prompts.inventory }]
      const inventoryResponse = await ai.models.generateContent({ ...assistantParams, ...structuredConfig, contents: inventoryContents })
      generating.splice(generating.indexOf('inventory'), 1)
      const { error: updateErrorInventory } = await locals.supabase.from('solo_concepts').update({ inventory: JSON.parse(inventoryResponse.text), generating }).eq('id', id)
      if (updateErrorInventory) { throw new Error(updateErrorInventory.message) }
    }

    // Plan
    if (generating.includes('generated_plan')) {
      const planConfig = { config: { ...assistantParams.config, thinkingConfig: { thinkingBudget: 1000 } } }
      const promptPlan = { text: prompts.prompt_plan }
      if (plan) { promptPlan.text += `Vypravěč uvedl toto zadání: "${plan}"` }
      const planContents = [basePrompt, { text: responseWorld.text }, { text: responseFactions.text }, { text: responseLocations.text }, { text: responseCharacters.text }, { text: responseProtagonist.text }, promptPlan]
      const ai2 = getAI(env)
      const planResponse = await ai2.models.generateContent({ ...assistantParams, ...planConfig, contents: planContents, model: 'gemini-2.5-pro' })
      const generatedPlan = { text: planResponse.text }
      generating.splice(generating.indexOf('generated_plan'), 1)
      const { error: updateErrorPlan } = await locals.supabase.from('solo_concepts').update({ generated_plan: generatedPlan.text, generating }).eq('id', id)
      if (updateErrorPlan) { throw new Error(updateErrorPlan.message) }
    }

    // Release concept when generation completes
    const { error: updateError } = await locals.supabase.from('solo_concepts').update({ published: true, generating: [], custom_header: getHash(), storyteller: npcData.id, generation_error: '' }).eq('id', id)
    if (updateError) { throw new Error(updateError.message) }
    console.log('Generation completed successfully for concept:', id)
  } catch (error) {
    console.error('Error in generateConcept:', error)
    await locals.supabase.from('solo_concepts').update({ generating: [], generation_error: error.message }).eq('id', id)
    throw error // re-throw to be caught by the caller
  }
}

export const GET = async ({ locals }) => {
  return new Response('OK:' + locals.runtime.env.PRIVATE_GEMINI, { status: 200 })
}

export const POST = async ({ request, locals }) => {
  console.log('Generating solo concept...')
  const data = await request.json()
  const { id, author, name } = data

  // Save generation start time for frontend timeout
  const { error: startError } = await locals.supabase.from('solo_concepts').update({
    generation_error: '',
    generation_started_at: new Date().toISOString()
  }).eq('id', id)
  if (startError) { throw new Error('Error starting solo concept generation: ' + startError.message) }

  if (!id || !author || !name) {
    console.error('Missing required fields for solo concept generation:', { id, author, name })
    return new Response(JSON.stringify({ error: { message: 'Některé povinné údaje chybí' } }), { status: 400 })
  }
  try {
    // Create the background task promise
    const generationPromise = generateConcept(locals, data).catch(error => {
      console.error('Error in background generation:', error)
      return locals.supabase.from('solo_concepts').update({ generation_error: error.message }).eq('id', id)
    })

    // Use waitUntil to ensure the background task completes
    if (locals.runtime?.ctx?.waitUntil) {
      console.log('Using waitUntil for background generation')
      locals.runtime.ctx.waitUntil(generationPromise)
    } else { // fallback for non-Cloudflare environments
      console.log('Using background generation without context.waitUntil')
      generationPromise.catch(err => console.error('Background generation failed:', err))
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error generating solo concept:', error)
    await locals.supabase.from('solo_concepts').update({ generation_error: error.message }).eq('id', id)
    return { error: { message: 'Chyba při generování konceptu: ' + error.message } }
  }
}
