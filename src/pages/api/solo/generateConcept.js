import { GoogleGenAI } from '@google/genai'

export const GET = async ({ url }) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.PUBLIC_GEMINI })
  const { id, name, annotation } = Object.fromEntries(url.searchParams)

  let storyWorld = ''
  let storyFactions = ''
  let storyLocations = ''
  let storyCharacters = ''
  let storyPlan = ''

  const basePrompt = `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
  Tvá úloha je pro vypravěče napsat podklady pro hru, formátované pomocí HTML 5 značek (důležité!). Ne markdown. Pouze text, žádné obrázky.
  Hra kterou připravujeme se jmenuje "${decodeURIComponent(name)}"
  Základní popis hry zní: "${decodeURIComponent(annotation)}"`

  const safetySettings = [
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
  ]
  const aiConfig = { model: 'gemini-2.5-flash', config: { safetySettings } }

  // World
  aiConfig.content = [basePrompt, 'Prompt pro tvorbu světa']
  const response = await ai.models.generateContent(aiConfig)
  storyWorld = response.text

  // Factions
  aiConfig.content = [basePrompt, 'Prompt pro tvorbu frakcí']
  const factionsResponse = await ai.models.generateContent(aiConfig)
  storyFactions = factionsResponse.text

  // Locations
  aiConfig.content = [basePrompt, 'Prompt pro tvorbu lokací']
  const locationsResponse = await ai.models.generateContent(aiConfig)
  storyLocations = locationsResponse.text

  // Characters
  aiConfig.content = [basePrompt, 'Prompt pro tvorbu postav']
  const charactersResponse = await ai.models.generateContent(aiConfig)
  storyCharacters = charactersResponse.text

  // Plan
  aiConfig.content = [basePrompt, 'Prompt pro tvorbu plánu hry']
  const planResponse = await ai.models.generateContent(aiConfig)
  storyPlan = planResponse.text

  // save
  console.log('Game id', id)
  console.log('Generated world:', storyWorld)
  console.log('Generated factions:', storyFactions)
  console.log('Generated locations:', storyLocations)
  console.log('Generated characters:', storyCharacters)
  console.log('Generated plan:', storyPlan)
  // const { error } = await locals.supabase.from('solo_concepts').update({ story_world: storyWorld, story_factions: storyFactions, story_locations: storyLocations, story_characters: storyCharacters, story_plan: storyPlan }).eq('id', id)
  // if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
