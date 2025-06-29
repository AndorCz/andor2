import { getHash } from '@lib/utils'
import { cropImageBackEnd } from '@lib/solo/server-utils'
import { GoogleGenAI, Modality, Type } from '@google/genai'

export const prompts = {
  world: '1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh.\n',
  factions: '2. Frakce: Jak je svět politicky uspořádaný? Popiš hlavní mocenské frakce tohoto světa a vztahy mezi nimi.\n',
  locations: '3. Lokace: Navrhni zajímavá místa kde by se mohl příběh odehrávat.\n',
  characters: '4. Postavy: Popiš konkrétně několik zajímavých postav které budou v příběhu vystupovat.\n',
  protagonist: '5. Protagonista: Napiš stručný text pro jednoho hráče (1on1 hra), který mu v jednom odstavci vysvětlí jakou postavu bude hrát. Jedna věta popisu vzhledu, seznam vybavení, seznam dovedností a jedna věta o nedávné minulosti. Osobnost a pohlaví bude na hráči samotném.\n',
  plan: '6. Plán hry: Připrav schematickou osnovu příběhu. Popiš plán tak, aby měla každá situace několik jasných východisek, které vždy posunou příběh do další scény. Příběh může i předčasně skončit smrtí postavy. Hra by měla být relativně krátká (jedno sezení, 3-5 scén) a mít jasně daný konec.\n',
  annotation: 'Napiš jeden odstavec poutavého reklamního textu, který naláká hráče k zahrání této hry. Zaměř se na atmosféru a hlavní témata příběhu. Výstup musí být plain-text, bez html.\n',
  protagonist_names: 'Napiš 10 různorodých jmen pro postavu, kterou bude hráč hrát. Čtyři jména jasně mužská, čtyři jasně ženská, dvě neutrální. Jména by měla by ladit s atmosférou světa. Použij buď jazyky daného světa, nebo stylová jména česká. Jména by měla být většinou včetně příjmení, s přezdívkou, výjimečně jen jedno jméno samotné.\n',
  header_image: 'Napiš pro AI prompt k vygenerování ilustračního obrázku pro tuto hru. Vymysli zajímavý motiv, který dobře popisuje téma hry, popiš vizuální styl, který vystihuje její atmosféru a estetiku. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. Styl by měl být profesionální digitální grafika, jako z ArtStation nebo koncept art AAA her. \n',
  first_image: 'Napiš pro AI prompt k vygenerování ilustračního obrázku pro první scénu této hry. Obrázek by měl zachytit podstatu první scény, ukazovat její charakteristické rysy a atmosféru. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. Styl by měl být profesionální digitální grafika, jako z ArtStation nebo koncept art AAA her.\n',
  storyteller_image: 'Napiš pro AI prompt k vygenerování portrétu pro NPC vypravěče této TTRPG hry. Obrázek by měl být ve stejném stylu jako hlavní obrázek hry a měl by být portrétem tajemné siluety, někoho, kdo by mohl být skrytou božskou bytostí v tomto světě. Duch, prázdný plášť, létající světlo, mrak, digitální bytost jako z Matrixu atd. Cokoliv, co se hodí k tématu hry. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. Styl by měl být profesionální digitální grafika, jako z ArtStation nebo koncept art AAA her.\n',
  protagonist_image: 'Napiš pro AI prompt k vygenerování portrétu hráčské postavy v TTRPG hře. Obrázek by měl zachytit podstatu postavy, ukazovat její charakteristické rysy a oděv. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. Styl by měl být profesionální digitální grafika, jako z ArtStation nebo koncept art AAA her.\n'
}

export const ai = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI })
export const assistantConfig = {
  model: 'gemini-2.5-flash-lite-preview-06-17',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    generationConfig: { thinkingConfig: { thinkingBudget: 0 } }, // fast response
    systemInstruction: { text: `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
      Tvá úloha je napsat textové podklady pro hru. Výstupem každé zprávy musí být samotný text podkladů, formátovaný pomocí HTML značek, bez oslovení, úvodu nebo obalení do Markdown bloku.
      Pokud použiješ přímou řeč k hráči, buď neformální a tykej.` }
  }
}

export const storytellerInstructions = `Jsi vypravěč (storyteller nebo game-master) online TTRPG hry.
  Herní styl: Hra je pro jednoho hráče, v češtině. Hraje se bez pravidlového systému, čistý roleplaying, tedy vypravěč (ty) vše rozhodne způsobem který je realistický a vede buď k zajímavému pokračování příběhu, nebo konci hry.
  Výstup: Piš vždy v HTML formátu, ale používej jen základní tagy, jako odkazy a tučný text pro přímou řeč. Žádné nadpisy, ikony, seznamy apod.
  Literární styl: Text vždy rozděluj do krátkých odstavců, po dvou až třech větách. Herní příspěvek by nikdy neměl být delší než dva odstavce. Jakmile napíšeš významnou novou informaci, ukonči příspěvek, aby měl hráči možnost brzy zareagovat svou akcí.
  Zákaz: Nikdy nepiš přímo seznam možností co může udělat. Nikdy předem neprozrazuj plán příběhu, pokud příspěvek nezačíná slovem "debug".
  Plán hry: Tvým cílem je vést hru podle připraveného plánu, který dostaneš v kontextu hry, sekci "Plán hry". Při přípravě každé odpovědi se zamysli nad tím, jak postavu co nejlépe nasměrovat k další části plánu hry. Neboj se improvizovat, pokud hráč udělá něco nečekaného, ale vždy se snaž držet plánu hry a přitom udržet hru zábavnou a napínavou. Také se neboj postavu nechat zemřít, pokud udělá něco hloupého nebo nevyjde něco riskantního, případně pokud hráč vystupuje z role postavy.`

export const storytellerConfig = {
  model: 'gemini-2.5-flash',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    thinkingConfig: { thinkingBudget: 200 },
    systemInstruction: storytellerInstructions,
    generationConfig: { responseMimeType: 'text/html' }
  }
}

export async function generateImage (prompt, aspectRatio, cropWidth, cropHeight) {
  try {
    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002', prompt, config: { responseModalities: [Modality.IMAGE], numberOfImages: 1, aspectRatio, includeRaiReason: true }
    })
    const headerImageBase64 = imageResponse?.generatedImages?.[0]?.image?.imageBytes
    if (!headerImageBase64) { throw new Error('No image generated') }
    const bufferImage = Buffer.from(headerImageBase64, 'base64')
    const { data, error } = await cropImageBackEnd(bufferImage, cropWidth, cropHeight)
    return { data, error }
  } catch (error) {
    console.error('Error generating image:', error)
    return { error: { message: 'Chyba při generování obrázku: ' + error.message } }
  }
}

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
export function getContext (conceptData, exclude) {
  const context = {
    basePrompt: { text: `Hra se bude jmenovat "${decodeURIComponent(conceptData.name)}". Zde jsou podklady (setting) pro tuto hru:` },
    world: { text: conceptData.generated_world },
    factions: { text: conceptData.generated_factions },
    locations: { text: conceptData.generated_locations },
    characters: { text: conceptData.generated_characters },
    protagonist: { text: conceptData.generated_protagonist }
  }
  if (exclude) { delete context[exclude] }
  return Object.values(context)
}

export function getContextString (conceptData, exclude) {
  const context = getContext(conceptData, exclude)
  return context.map(item => item.text).join('\n\n')
}

export async function generateSoloConcept (supabase, conceptData) {
  try {
    let error
    let contents

    console.log('Starting concept generation for:', conceptData.id)
    const basePrompt = { text: `Hra kterou připravujeme se jmenuje "${decodeURIComponent(conceptData.name)}"` }
    // const generating = ['generated_world', 'generated_factions', 'generated_locations', 'generated_characters', 'generated_protagonist', 'generated_plan', 'annotation', 'protagonist_names', 'generated_image_prompt', 'header_image', 'storyteller_image']

    // World
    const worldMessage = { text: prompts.world }
    if (conceptData.prompt_world) { worldMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_world}"` }
    contents = [basePrompt, worldMessage]
    const response = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedWorld = { text: response.text }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_world'), 1)
    const { error: updateErrorWorld } = await supabase.from('solo_concepts').update({ generated_world: generatedWorld.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorWorld) { throw new Error(updateErrorWorld.message) }
    // console.log('Generated world:', generatedWorld.text)

    // Factions
    const factionsMessage = { text: prompts.factions }
    if (conceptData.prompt_factions) { factionsMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_factions}"` }
    contents = [basePrompt, worldMessage, generatedWorld, factionsMessage]
    const factionsResponse = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedFactions = { text: factionsResponse.text }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_factions'), 1)
    const { error: updateErrorFactions } = await supabase.from('solo_concepts').update({ generated_factions: generatedFactions.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorFactions) { throw new Error(updateErrorFactions.message) }
    // console.log('Generated factions:', generatedFactions.text)

    // Locations
    const locationsMessage = { text: prompts.locations }
    if (conceptData.prompt_locations) { locationsMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_locations}"` }
    contents = [basePrompt, worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage]
    const locationsResponse = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedLocations = { text: locationsResponse.text }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_locations'), 1)
    const { error: updateErrorLocations } = await supabase.from('solo_concepts').update({ generated_locations: generatedLocations.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorLocations) { throw new Error(updateErrorLocations.message) }
    // console.log('Generated locations:', generatedLocations.text)

    // Characters
    const charactersMessage = { text: prompts.characters }
    if (conceptData.prompt_characters) { charactersMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_characters}"` }
    contents = [basePrompt, worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage]
    const charactersResponse = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedCharacters = { text: charactersResponse.text }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_characters'), 1)
    const { error: updateErrorCharacters } = await supabase.from('solo_concepts').update({ generated_characters: generatedCharacters.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorCharacters) { throw new Error(updateErrorCharacters.message) }
    // console.log('Generated characters:', generatedCharacters.text)

    // Protagonist
    const protagonistMessage = { text: prompts.protagonist }
    if (conceptData.prompt_protagonist) { protagonistMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_protagonist}"` }
    contents = [basePrompt, worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage]
    const protagonistResponse = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedProtagonist = { text: protagonistResponse.text }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_protagonist'), 1)
    const { error: updateErrorProtagonist } = await supabase.from('solo_concepts').update({ generated_protagonist: generatedProtagonist.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorProtagonist) { throw new Error(updateErrorProtagonist.message) }
    // console.log('Generated protagonist:', generatedProtagonist.text)

    // Plan
    const planConfig = { config: { ...assistantConfig.config, thinkingConfig: { thinkingBudget: 1000 } } }
    const planMessage = { text: prompts.plan }
    if (conceptData.prompt_plan) { planMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_plan}"` }
    contents = [basePrompt, worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage, generatedProtagonist, planMessage]
    const ai2 = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI }) // workaround for getting previous parts again
    const planResponse = await ai2.models.generateContent({ ...assistantConfig, ...planConfig, contents, model: 'gemini-2.5-pro' })
    const generatedPlan = { text: planResponse.text }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_plan'), 1)
    const { error: updateErrorPlan } = await supabase.from('solo_concepts').update({ generated_plan: generatedPlan.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorPlan) { throw new Error(updateErrorPlan.message) }
    // console.log('Generated plan:', generatedPlan.text)

    // Annotation
    const annotationMessage = { text: prompts.annotation }
    contents = [basePrompt, worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage, generatedProtagonist, planMessage, generatedPlan, annotationMessage]
    const annotationResponse = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedAnnotation = { text: annotationResponse.text }
    conceptData.generating.splice(conceptData.generating.indexOf('annotation'), 1)
    const { error: updateErrorAnnotation } = await supabase.from('solo_concepts').update({ annotation: generatedAnnotation.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorAnnotation) { throw new Error(updateErrorAnnotation.message) }
    // console.log('Generated annotation:', generatedAnnotation.text)

    // Protagonist names
    const structuredConfig = { config: { responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }, responseMimeType: 'application/json' } }
    contents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${conceptData.name}":` }, worldMessage, generatedWorld, protagonistMessage, generatedProtagonist, { text: prompts.protagonistNames }]
    const protagonistNamesResponse = await ai.models.generateContent({ ...assistantConfig, ...structuredConfig, contents })
    conceptData.generating.splice(conceptData.generating.indexOf('protagonist_names'), 1)
    const { error: updateErrorProtagonistNames } = await supabase.from('solo_concepts').update({ protagonist_names: JSON.parse(protagonistNamesResponse.text), generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorProtagonistNames) { throw new Error(updateErrorProtagonistNames.message) }
    // console.log('Generated protagonist names:', protagonistNamesResponse.text)

    // Header image prompt
    const imageMessage = { text: prompts.headerImage }
    if (conceptData.prompt_image) { imageMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_image}"` }
    contents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${conceptData.name}":` }, generatedAnnotation, generatedWorld, imageMessage]
    const imagePromptResponse = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedImagePrompt = imagePromptResponse.text
    conceptData.generating.splice(conceptData.generating.indexOf('generated_image_prompt'), 1)
    const { error: updateErrorImage } = await supabase.from('solo_concepts').update({ generated_image_prompt: generatedImagePrompt, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorImage) { throw new Error(updateErrorImage.message) }
    // console.log('Generated image prompt:', generatedImagePrompt)

    // Generate header image
    const { data: headerImage, error: headerImageError } = await generateImage(generatedImagePrompt.text, '16:9', 1100, 226)
    if (headerImageError) { error = headerImageError.message }
    // console.log('Generated header image:', image ? 'Image generated successfully' : 'No image generated')
    if (headerImage) {
      const { error: uploadError } = await supabase.storage.from('headers').upload(`solo-${conceptData.id}.jpg`, headerImage, { contentType: 'image/jpg' })
      if (uploadError) { throw new Error(uploadError.message) }
    }
    conceptData.generating.splice(conceptData.generating.indexOf('header_image'), 1)

    // Storyteller image prompt
    const storytellerImageMessage = { text: prompts.storytellerImage }
    contents = [{ text: `Následující text popisuje TTRPG hru pod názvem "${conceptData.name}":` }, generatedAnnotation, generatedWorld, storytellerImageMessage]
    const storytellerImagePromptResponse = await ai.models.generateContent({ ...assistantConfig, contents })
    const generatedStorytellerImagePrompt = storytellerImagePromptResponse.text
    conceptData.generating.splice(conceptData.generating.indexOf('storyteller_image_prompt'), 1)
    // console.log('Generated storyteller image prompt:', generatedStorytellerImagePrompt)

    // Add storyteller npc
    const npc = { name: 'Vypravěč', solo_concept: conceptData.id, storyteller: true, created_at: new Date(), image: getHash() }
    const { data: npcData, error: npcError } = await locals.supabase.from('npcs').insert(npc).select().single()
    if (npcError) { throw new Error('Chyba při vytváření NPC: ' + npcError.message) }

    // Generate storyteller image
    const { data: storytellerImage, error: storytellerImageError } = await generateImage(generatedStorytellerImagePrompt.text, '9:16', 140, 352) // generated size is 768x1408
    if (storytellerImageError) { error = storytellerImageError.message }
    conceptData.generating.splice(conceptData.generating.indexOf('storyteller_image'), 1)
    if (storytellerImage) {
      const { error: uploadError } = await supabase.storage.from('npcs').upload(`${conceptData.id}/${npcData.id}.jpg`, storytellerImage, { contentType: 'image/jpg' })
      if (uploadError) { throw new Error(uploadError.message) }
    }

    // Release concept when generation completes
    const { error: updateError } = await supabase.from('solo_concepts').update({ published: true, generating: conceptData.generating, custom_header: getHash(), storyteller: npcData.id }).eq('id', conceptData.id)
    if (updateError) { throw new Error(updateError.message) }
    // console.log('Concept generation completed and saved, concept id:', conceptData.id)

    return { error, data: { success: true } }
  } catch (error) {
    console.error('Error generating solo concept:', error)
    return { error: { message: 'Chyba při generování konceptu: ' + error.message } }
  }
}
