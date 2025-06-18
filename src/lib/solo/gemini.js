import { cropImageBackEnd } from '@lib/solo/server-utils'
import { GoogleGenAI, Modality } from '@google/genai'

export const ai = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI })
export const safetySettings = [
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
]
export const aiConfig = { model: 'gemini-2.5-flash-preview-05-20', config: { safetySettings, thinkingConfig: { thinkingBudget: 0 } } }

export function getBasePrompt (conceptData) {
  return {
    text: `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
      Tvá úloha je napsat textové podklady pro hru. Výstupem každé zprávy musí být samotný text podkladů, formátovaný pomocí HTML značek, bez oslovení, úvodu nebo obalení do Markdown bloku.
      Hra kterou připravujeme se jmenuje "${decodeURIComponent(conceptData.name)}"
      Postupně budeme připravovat podklady v těchto částech: 1. Svět, 2. Frakce, 3. Lokace, 4. Postavy, 5. Protagonista, 6. Plán hry.
      Zpracuj vždy jen jednu danou část.
    `
  }
}

export const prompts = {
  world: '1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh.\n',
  factions: '2. Frakce: Jak je svět politicky uspořádaný? Popiš hlavní mocenské frakce tohoto světa a vztahy mezi nimi.\n',
  locations: '3. Lokace: Navrhni zajímavá místa kde by se mohl příběh odehrávat.\n',
  characters: '4. Postavy: Popiš konkrétně několik zajímavých postav které budou v příběhu vystupovat.\n',
  protagonist: '5. Protagonista: Napiš stručný text pro jednoho hráče (1on1 hra), který mu v jednom odstavci vysvětlí jakou postavu bude hrát. Jedna věta popisu vzhledu, seznam vybavení, seznam dovedností a jedna věta o nedávné minulosti. Osobnost a pohlaví bude na hráči samotném.\n',
  plan: '6. Plán hry: Připrav schematickou osnovu příběhu. Popiš plán tak, aby měla každá situace několik jasných východisek, které vždy posunou příběh do další scény. Příběh může i předčasně skončit smrtí postavy. Hra by měla být relativně krátká (jedno sezení, 3-5 scén) a mít jasně daný konec.\n',
  annotation: 'Napiš jeden odstavec poutavého reklamního textu, který naláká hráče k zahrání této hry. Zaměř se na atmosféru a hlavní témata příběhu.\n',
  image: 'Napiš prosím prompt pro AI generování ilustračního obrázku pro tuto hru. Vymysli zajímavý motiv dobře vystihující téma hry, plus popiš vizuální styl který vystihne její atmosféru a estetiku. Výstup musí být plain-text, jeden odstavec, maximálně o délce 480 tokenů.\n'
}

export async function generateSoloConcept (conceptData) {
  let error

  // World
  const worldMessage = { text: prompts.world }
  if (conceptData.prompt_world) { worldMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_world}"` }
  aiConfig.contents = [getBasePrompt(conceptData), worldMessage]
  const response = await ai.models.generateContent(aiConfig)
  const generatedWorld = { text: response.text }

  // Factions
  const factionsMessage = { text: prompts.factions }
  if (conceptData.prompt_factions) { factionsMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_factions}"` }
  aiConfig.contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage]
  const factionsResponse = await ai.models.generateContent(aiConfig)
  const generatedFactions = { text: factionsResponse.text }

  // Locations
  const locationsMessage = { text: prompts.locations }
  if (conceptData.prompt_locations) { locationsMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_locations}"` }
  aiConfig.contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage]
  const locationsResponse = await ai.models.generateContent(aiConfig)
  const generatedLocations = { text: locationsResponse.text }

  // Characters
  const charactersMessage = { text: prompts.characters }
  if (conceptData.prompt_characters) { charactersMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_characters}"` }
  aiConfig.contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage]
  const charactersResponse = await ai.models.generateContent(aiConfig)
  const generatedCharacters = { text: charactersResponse.text }

  // Protagonist
  const protagonistMessage = { text: prompts.protagonist }
  if (conceptData.prompt_protagonist) { protagonistMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_protagonist}"` }
  aiConfig.contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage]
  const protagonistResponse = await ai.models.generateContent(aiConfig)
  const generatedProtagonist = { text: protagonistResponse.text }

  // Plan
  const planMessage = { text: prompts.plan }
  aiConfig.contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage, generatedProtagonist, planMessage]
  const planResponse = await ai.models.generateContent({ ...aiConfig, config: { ...aiConfig.config, thinkingConfig: { thinkingBudget: 1000 } } })
  const generatedPlan = { text: planResponse.text }

  // Annotation
  const annotationMessage = { text: prompts.annotation }
  aiConfig.contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage, generatedProtagonist, planMessage, generatedPlan, annotationMessage]
  const annotationResponse = await ai.models.generateContent(aiConfig)
  const generatedAnnotation = { text: annotationResponse.text }

  // Image prompt
  const imageMessage = { text: prompts.image }
  if (conceptData.prompt_image) { imageMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_image}"` }
  aiConfig.contents = ['Následující text popisuje setting pro TTRPG hru: ', worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage, generatedProtagonist, planMessage, generatedPlan, annotationMessage, generatedAnnotation, imageMessage]
  const imagePromptResponse = await ai.models.generateContent(aiConfig)
  const generatedImage = { text: imagePromptResponse.text }

  // Generate header image
  const { image, error: imageError } = await generateHeaderImage(generatedImage)
  if (imageError) { error = imageError.message }

  return {
    error,
    data: {
      generatedWorld: generatedWorld.text,
      generatedFactions: generatedFactions.text,
      generatedLocations: generatedLocations.text,
      generatedCharacters: generatedCharacters.text,
      generatedProtagonist: generatedProtagonist.text,
      generatedPlan: generatedPlan.text,
      generatedAnnotation: generatedAnnotation.text,
      generatedImage: generatedImage.text,
      headerImageBuffer: image
    }
  }
}

export async function generateHeaderImage (imageMessage) {
  try {
    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: imageMessage,
      config: { responseModalities: [Modality.IMAGE], numberOfImages: 1, aspectRatio: '16:9', includeRaiReason: true }
    })
    const headerImageBase64 = imageResponse?.generatedImages?.[0]?.image?.imageBytes
    if (!headerImageBase64) { throw new Error('No image generated') }
    const bufferImage = Buffer.from(headerImageBase64, 'base64')
    const { data, error } = await cropImageBackEnd(bufferImage, 16 / 9, 1024, 576)
    return { data, error }
  } catch (error) {
    console.error('Error generating header image:', error)
    return { error: { message: 'Chyba při generování obrázku: ' + error.message } }
  }
}
