import { GoogleGenAI } from '@google/genai'

export const POST = async ({ request, locals, redirect }) => {
  console.log('Generating concept')
  const requestData = await request.json()
  const { conceptId } = requestData
  const referer = request.headers.get('referer')
  if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo id konceptu')) }

  const { data: conceptData, error: conceptError } = await locals.supabase.from('solo_concepts').select().eq('id', conceptId).maybeSingle()
  if (conceptError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError.message)) }

  console.log('Concept data:', conceptData)

  if (conceptData.generating === false) {
    console.log('PUBLIC_GEMINI API key ', import.meta.env.PUBLIC_GEMINI)

    const { error: conceptError2 } = await locals.supabase.from('solo_concepts').update({ generating: true }).eq('id', conceptId)
    if (conceptError2) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError2.message)) }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.PUBLIC_GEMINI })

    let storyWorld = ''
    let storyFactions = ''
    let storyLocations = ''
    let storyCharacters = ''
    let storyPlan = ''

    const safetySettings = [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
    const aiConfig = { model: 'gemini-2.5-flash', config: { safetySettings } }

    const basePrompt = {
      text: `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
        Tvá úloha je napsat textové podklady pro hru, formátované pomocí HTML značek.
        Hra kterou připravujeme se jmenuje "${decodeURIComponent(conceptData.name)}"
        Postupně budeme připravovat podklady v těchto částech:
        1. Svět
        2. Příběh
        3. Protagonista
        4. Lokace
        5. Postavy
        Zpracuj vždy jen jednu danou část.
      `
    }
    // World
    const promptWorld = { text: '1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, hlavní mocenské síly, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh.' }
    if (conceptData.prompt_world) { promptWorld.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_world}"` }
    aiConfig.content = [basePrompt, promptWorld]
    const response = await ai.models.generateContent(aiConfig)
    storyWorld = { text: response.text }
    console.log('storyWorld', storyWorld)

    // Factions
    const promptFactions = { text: '2. Frakce: ' }
    if (conceptData.prompt_factions) { promptFactions.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_factions}"` }
    aiConfig.content = [basePrompt, promptWorld, storyWorld, promptFactions]
    const factionsResponse = await ai.models.generateContent(aiConfig)
    storyFactions = { text: factionsResponse.text }
    console.log('storyFactions', storyFactions)

    // Locations
    const promptLocations = { text: '3. Lokace: ' }
    if (conceptData.prompt_locations) { promptLocations.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_locations}"` }
    aiConfig.content = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations]
    const locationsResponse = await ai.models.generateContent(aiConfig)
    storyLocations = { text: locationsResponse.text }
    console.log('storyLocations', storyLocations)

    // Characters
    const promptCharacters = { text: '4. Postavy: ' }
    if (conceptData.prompt_characters) { promptCharacters.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_characters}"` }
    aiConfig.content = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations, storyLocations, promptCharacters]
    const charactersResponse = await ai.models.generateContent(aiConfig)
    storyCharacters = { text: charactersResponse.text }
    console.log('storyCharacters', storyCharacters)

    // Plan
    const promptPlan = { text: '5. Plán: ' }
    aiConfig.content = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations, storyLocations, promptCharacters, storyCharacters, promptPlan]
    const planResponse = await ai.models.generateContent(aiConfig)
    storyPlan = { text: planResponse.text }
    console.log('storyPlan', storyPlan)

    // save
    console.log('Generation done')
    const { error } = await locals.supabase.from('solo_concepts').update({ generating: false, story_world: storyWorld, story_factions: storyFactions, story_locations: storyLocations, story_characters: storyCharacters, story_plan: storyPlan }).eq('id', conceptData.id)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
    console.log('Concept saved')

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } else {
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Koncept se již generuje'))
  }
}
