import { Type } from '@google/genai'
import { getHash } from '@lib/utils'
import { generateImage } from '@lib/solo/server-aiml'

import { getAI, assistantParams, assistantInstructions, prompts, imageParams } from '@lib/solo/server-gemini'

async function generateConcept (locals, params) {
  const { id, name, world, factions, locations, characters, protagonist, promptHeaderImage, promptStorytellerImage, plan } = params
  console.log('Generating with parameters:', { world, factions, locations, characters, protagonist, promptHeaderImage, promptStorytellerImage, plan })
  const env = locals.runtime.env
  console.log('env.PRIVATE_GEMINI:', env.PRIVATE_GEMINI)
  const ai = getAI(env)
  const structuredConfig = { config: { responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }, responseMimeType: 'application/json' } }
  const basePrompt = { text: `Hra kterou připravujeme se jmenuje "${decodeURIComponent(name)}"` }
  const chat = ai.chats.create({ ...assistantParams, history: [{ role: 'user', parts: [{ text: assistantInstructions }, basePrompt] }] })
  const generating = ['generated_world', 'generated_factions', 'generated_locations', 'generated_characters', 'generated_protagonist', 'annotation', 'generated_header_image', 'generated_storyteller_image', 'header_image', 'storyteller_image', 'protagonist_names', 'inventory', 'generated_plan']

  // World
  const promptWorld = { text: prompts.prompt_world }
  if (world) { promptWorld.text += `Vypravěč uvedl toto zadání: "${world}"` }
  console.log('Sending message for world generation:', promptWorld)
  const responseWorld = await chat.sendMessage({ message: promptWorld })
  console.log('Received response for world generation:', responseWorld.text)
  generating.splice(generating.indexOf('generated_world'), 1)
  const { error: updateErrorWorld } = await locals.supabase.from('solo_concepts').update({ generated_world: responseWorld.text, generating }).eq('id', id)
  if (updateErrorWorld) { throw new Error(updateErrorWorld.message) }
  console.log('World generation completed successfully')

  // Factions
  const promptFactions = { text: prompts.prompt_factions }
  if (factions) { promptFactions.text += `Vypravěč uvedl toto zadání: "${factions}"` }
  const responseFactions = await chat.sendMessage({ message: promptFactions })
  generating.splice(generating.indexOf('generated_factions'), 1)
  const { error: updateErrorFactions } = await locals.supabase.from('solo_concepts').update({ generated_factions: responseFactions.text, generating }).eq('id', id)
  if (updateErrorFactions) { throw new Error(updateErrorFactions.message) }

  // Locations
  const promptLocations = { text: prompts.prompt_locations }
  if (locations) { promptLocations.text += `Vypravěč uvedl toto zadání: "${locations}"` }
  const responseLocations = await chat.sendMessage({ message: promptLocations })
  generating.splice(generating.indexOf('generated_locations'), 1)
  const { error: updateErrorLocations } = await locals.supabase.from('solo_concepts').update({ generated_locations: responseLocations.text, generating }).eq('id', id)
  if (updateErrorLocations) { throw new Error(updateErrorLocations.message) }

  // Characters
  const promptCharacters = { text: prompts.prompt_characters }
  if (characters) { promptCharacters.text += `Vypravěč uvedl toto zadání: "${characters}"` }
  const responseCharacters = await chat.sendMessage({ message: promptCharacters })
  generating.splice(generating.indexOf('generated_characters'), 1)
  const { error: updateErrorCharacters } = await locals.supabase.from('solo_concepts').update({ generated_characters: responseCharacters.text, generating }).eq('id', id)
  if (updateErrorCharacters) { throw new Error(updateErrorCharacters.message) }

  // Protagonist
  const promptProtagonist = { text: prompts.prompt_protagonist }
  if (protagonist) { promptProtagonist.text += `Vypravěč uvedl toto zadání: "${protagonist}"` }
  const responseProtagonist = await chat.sendMessage({ message: promptProtagonist })
  generating.splice(generating.indexOf('generated_protagonist'), 1)
  const { error: updateErrorProtagonist } = await locals.supabase.from('solo_concepts').update({ generated_protagonist: responseProtagonist.text, generating }).eq('id', id)
  if (updateErrorProtagonist) { throw new Error(updateErrorProtagonist.message) }

  // Annotation
  const responseAnnotation = await chat.sendMessage({ message: prompts.annotation })
  generating.splice(generating.indexOf('annotation'), 1)
  const { error: updateErrorAnnotation } = await locals.supabase.from('solo_concepts').update({ annotation: responseAnnotation.text, generating }).eq('id', id)
  if (updateErrorAnnotation) { throw new Error(updateErrorAnnotation.message) }

  // Header image prompt
  const headerImagePrompt = { text: prompts.prompt_header_image }
  if (promptHeaderImage) { headerImagePrompt.text += `Vypravěč uvedl toto zadání: "${promptHeaderImage}"` }
  const responseHeaderImagePrompt = await chat.sendMessage({ message: headerImagePrompt })
  generating.splice(generating.indexOf('generated_header_image'), 1)
  const { error: updateErrorImage } = await locals.supabase.from('solo_concepts').update({ generated_header_image: responseHeaderImagePrompt.text, generating }).eq('id', id)
  if (updateErrorImage) { throw new Error(updateErrorImage.message) }

  // Storyteller image prompt
  const storytellerImagePrompt = { text: prompts.prompt_storyteller_image }
  if (promptStorytellerImage) { storytellerImagePrompt.text += `Vypravěč uvedl toto zadání: "${promptStorytellerImage}"` }
  const responseStorytellerImagePrompt = await chat.sendMessage({ message: storytellerImagePrompt })
  generating.splice(generating.indexOf('generated_storyteller_image'), 1)
  const { error: updateErrorStorytellerImage } = await locals.supabase.from('solo_concepts').update({ generated_storyteller_image: responseStorytellerImagePrompt.text, generating }).eq('id', id)
  if (updateErrorStorytellerImage) { throw new Error(updateErrorStorytellerImage.message) }

  // Add storyteller npc
  const gameSlug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '')
  const npc = { name: 'Vypravěč', slug: `vypravec-${gameSlug}`, solo_concept: id, storyteller: true, created_at: new Date(), portrait: getHash() }
  const { data: npcData, error: npcError } = await locals.supabase.from('npcs').insert(npc).select().single()
  if (npcError) { throw new Error(npcError.message) }

  // Header image
  const { data: headerImage, error: headerImageError } = await generateImage(env, responseHeaderImagePrompt.text, imageParams.header)
  if (headerImageError) { throw new Error(headerImageError.message) }
  if (headerImage) {
    const { error: headerUploadError } = await locals.supabase.storage.from('headers').upload(`solo-${id}.jpg`, headerImage, { contentType: 'image/jpg', upsert: true })
    if (headerUploadError) { throw new Error(headerUploadError.message) }
  }
  generating.splice(generating.indexOf('header_image'), 1)
  const { error: updateHeaderImageError } = await locals.supabase.from('solo_concepts').update({ generating }).eq('id', id)
  if (updateHeaderImageError) { throw new Error(updateHeaderImageError.message) }

  // Storyteller image
  const { data: storytellerImage, error: storytellerImageError } = await generateImage(env, responseStorytellerImagePrompt.text, imageParams.npc)
  if (storytellerImageError) { throw new Error(storytellerImageError.message) }
  if (storytellerImage) {
    const { error: storytellerUploadError } = await locals.supabase.storage.from('portraits').upload(`${npcData.id}.jpg`, storytellerImage, { contentType: 'image/jpg', upsert: true })
    if (storytellerUploadError) { throw new Error(storytellerUploadError.message) }
  }
  generating.splice(generating.indexOf('storyteller_image'), 1)
  const { error: updateStorytellerImageError } = await locals.supabase.from('solo_concepts').update({ generating }).eq('id', id)
  if (updateStorytellerImageError) { throw new Error(updateStorytellerImageError.message) }

  // Protagonist names
  const protagonistContents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${name}":` }, { text: responseWorld.text }, { text: responseProtagonist.text }, { text: prompts.protagonist_names }]
  const protagonistNamesResponse = await ai.models.generateContent({ ...assistantParams, ...structuredConfig, contents: protagonistContents })
  generating.splice(generating.indexOf('protagonist_names'), 1)
  const { error: updateErrorProtagonistNames } = await locals.supabase.from('solo_concepts').update({ protagonist_names: JSON.parse(protagonistNamesResponse.text), generating }).eq('id', id)
  if (updateErrorProtagonistNames) { throw new Error(updateErrorProtagonistNames.message) }

  // Inventory
  const inventoryContents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${name}":` }, { text: responseWorld.text }, { text: responseProtagonist.text }, { text: prompts.inventory }]
  const inventoryResponse = await ai.models.generateContent({ ...assistantParams, ...structuredConfig, contents: inventoryContents })
  generating.splice(generating.indexOf('inventory'), 1)
  const { error: updateErrorInventory } = await locals.supabase.from('solo_concepts').update({ inventory: JSON.parse(inventoryResponse.text), generating }).eq('id', id)
  if (updateErrorInventory) { throw new Error(updateErrorInventory.message) }

  // Plan
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

  // Release concept when generation completes
  const { error: updateError } = await locals.supabase.from('solo_concepts').update({ published: true, generating: [], custom_header: getHash(), storyteller: npcData.id }).eq('id', id)
  if (updateError) { throw new Error(updateError.message) }
}

export const GET = async ({ locals }) => {
  return new Response('OK:' + locals.runtime.env.PRIVATE_GEMINI, { status: 200 })
}

export const POST = async ({ request, locals }) => {
  console.log('Generating solo concept...')
  const data = await request.json()
  const { id, author, name } = data
  console.log('Received data:', data)
  if (!id || !author || !name) {
    console.error('Missing required fields for solo concept generation:', { id, author, name })
    return new Response(JSON.stringify({ error: { message: 'Některé povinné údaje chybí' } }), { status: 400 })
  }
  try {
    generateConcept(locals, data) // fire and forget, the next page shows generation status
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error generating solo concept:', error)
    await locals.supabase.from('solo_concepts').update({ generating: [], generation_error: error.message }).eq('id', id)
    return { error: { message: 'Chyba při generování konceptu: ' + error.message } }
  }
}
