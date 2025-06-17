import { GoogleGenAI } from '@google/genai'

export const POST = async ({ request, locals, redirect }) => {
  console.log('Generating concept')
  const requestData = await request.json()
  const { conceptId } = requestData
  const referer = request.headers.get('referer')
  if (!locals.user.id || !conceptId) { return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Chybí přihlášení a/nebo id konceptu')) }

  const { data: conceptData, error: conceptError } = await locals.supabase.from('solo_concepts').select().eq('id', conceptId).maybeSingle()
  if (conceptError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError.message)) }

  if (conceptData.generating === false) {
    console.log('PRIVATE_GEMINI API key ', import.meta.env.PRIVATE_GEMINI)

    const { error: conceptError2 } = await locals.supabase.from('solo_concepts').update({ generating: true }).eq('id', conceptId)
    if (conceptError2) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(conceptError2.message)) }

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI })

      let storyWorld = ''
      let storyFactions = ''
      let storyLocations = ''
      let storyCharacters = ''
      let storyProtagonist = ''
      let storyPlan = ''

      const safetySettings = [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
      const aiConfig = { model: 'gemini-2.5-flash-preview-05-20', config: { safetySettings } }

      const basePrompt = {
        text: `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
          Tvá úloha je napsat textové podklady pro hru. Výstupem každé zprávy musí být samotný text podkladů, formátovaný pomocí HTML značek, bez oslovení, úvodu nebo obalení do Markdown bloku.
          Hra kterou připravujeme se jmenuje "${decodeURIComponent(conceptData.name)}"
          Postupně budeme připravovat podklady v těchto částech: 1. Svět, 2. Frakce, 3. Lokace, 4. Postavy, 5. Protagonista, 6. Plán hry.
          Zpracuj vždy jen jednu danou část.
        `
      }
      // World
      const promptWorld = { text: '1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh.' }
      if (conceptData.prompt_world) { promptWorld.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_world}"` }
      aiConfig.contents = [basePrompt, promptWorld]
      const response = await ai.models.generateContent(aiConfig)
      storyWorld = { text: response.text }
      console.log('storyWorld', storyWorld)

      // Factions
      const promptFactions = { text: '2. Frakce: Jak je svět politicky uspořádaný? Popiš hlavní mocenské frakce tohoto světa a vztahy mezi nimi.' }
      if (conceptData.prompt_factions) { promptFactions.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_factions}"` }
      aiConfig.contents = [basePrompt, promptWorld, storyWorld, promptFactions]
      const factionsResponse = await ai.models.generateContent(aiConfig)
      storyFactions = { text: factionsResponse.text }
      console.log('storyFactions', storyFactions)

      // Locations
      const promptLocations = { text: '3. Lokace: Navrhni zajímavá místa kde by se mohl příběh odehrávat.' }
      if (conceptData.prompt_locations) { promptLocations.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_locations}"` }
      aiConfig.contents = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations]
      const locationsResponse = await ai.models.generateContent(aiConfig)
      storyLocations = { text: locationsResponse.text }
      console.log('storyLocations', storyLocations)

      // Characters
      const promptCharacters = { text: '4. Postavy: Popiš konkrétně několik zajímavých postav které budou v příběhu vystupovat.' }
      if (conceptData.prompt_characters) { promptCharacters.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_characters}"` }
      aiConfig.contents = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations, storyLocations, promptCharacters]
      const charactersResponse = await ai.models.generateContent(aiConfig)
      storyCharacters = { text: charactersResponse.text }
      console.log('storyCharacters', storyCharacters)

      // Protagonist
      const promptProtagonist = { text: '5. Protagonista: Napiš stručný text pro jednoho hráče (1on1 hra), který mu v jednom odstavci vysvětlí jakou postavu bude hrát. Jedna věta popisu vzhledu, seznam vybavení, seznam dovedností a jedna věta o nedávné minulosti. Osobnost a pohlaví bude na hráči samotném.' }
      if (conceptData.prompt_protagonist) { promptProtagonist.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_protagonist}"` }
      aiConfig.contents = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations, storyLocations, promptCharacters, storyCharacters, promptProtagonist]
      const protagonistResponse = await ai.models.generateContent(aiConfig)
      storyProtagonist = { text: protagonistResponse.text }
      console.log('storyProtagonist', storyProtagonist)

      // Plan
      const promptPlan = { text: '6. Plán hry: Připrav schematickou osnovu příběhu. Popiš plán tak, aby měla každá situace několik jasných východisek, které vždy posunou příběh do další scény. Příběh může i předčasně skončit smrtí postavy. Hra by měla být relativně krátká (jedno sezení, 3-5 scén) a mít jasně daný konec.' }
      aiConfig.contents = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations, storyLocations, promptCharacters, storyCharacters, promptProtagonist, storyProtagonist, promptPlan]
      const planResponse = await ai.models.generateContent(aiConfig)
      storyPlan = { text: planResponse.text }
      console.log('storyPlan', storyPlan)

      // Annotation
      const promptAnnotation = { text: 'Napiš jeden odstavec poutavého reklamního textu, který naláká hráče k zahrání této hry. Zaměř se na atmosféru a hlavní témata příběhu.' }
      aiConfig.contents = [basePrompt, promptWorld, storyWorld, promptFactions, storyFactions, promptLocations, storyLocations, promptCharacters, storyCharacters, promptProtagonist, storyProtagonist, promptPlan, storyPlan, promptAnnotation]
      const annotationResponse = await ai.models.generateContent(aiConfig)
      const storyAnnotation = { text: annotationResponse.text }
      console.log('storyAnnotation', storyAnnotation)

      // Save
      console.log('Generation done')
      const { error } = await locals.supabase.from('solo_concepts').update({ generating: false, story_world: storyWorld.text, story_factions: storyFactions.text, story_locations: storyLocations.text, story_characters: storyCharacters.text, story_protagonist: storyProtagonist.text, story_plan: storyPlan.text, annotation: storyAnnotation.text }).eq('id', conceptData.id)
      if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
      console.log('Concept saved')

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
