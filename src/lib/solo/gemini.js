import { cropImageBackEnd } from '@lib/solo/server-utils'
import { GoogleGenAI, Modality } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI })

function getBasePrompt (conceptData) {
  return {
    text: `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
      Tvá úloha je napsat textové podklady pro hru. Výstupem každé zprávy musí být samotný text podkladů, formátovaný pomocí HTML značek, bez oslovení, úvodu nebo obalení do Markdown bloku.
      Hra kterou připravujeme se jmenuje "${decodeURIComponent(conceptData.name)}"
      Postupně budeme připravovat podklady v těchto částech: 1. Svět, 2. Frakce, 3. Lokace, 4. Postavy, 5. Protagonista, 6. Plán hry.
      Zpracuj vždy jen jednu danou část.
    `
  }
}

const promptWorld = '1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh.\n'
const promptFactions = '2. Frakce: Jak je svět politicky uspořádaný? Popiš hlavní mocenské frakce tohoto světa a vztahy mezi nimi.\n'
const promptLocations = '3. Lokace: Navrhni zajímavá místa kde by se mohl příběh odehrávat.\n'
const promptCharacters = '4. Postavy: Popiš konkrétně několik zajímavých postav které budou v příběhu vystupovat.\n'
const promptProtagonist = '5. Protagonista: Napiš stručný text pro jednoho hráče (1on1 hra), který mu v jednom odstavci vysvětlí jakou postavu bude hrát. Jedna věta popisu vzhledu, seznam vybavení, seznam dovedností a jedna věta o nedávné minulosti. Osobnost a pohlaví bude na hráči samotném.\n'
const promptPlan = '6. Plán hry: Připrav schematickou osnovu příběhu. Popiš plán tak, aby měla každá situace několik jasných východisek, které vždy posunou příběh do další scény. Příběh může i předčasně skončit smrtí postavy. Hra by měla být relativně krátká (jedno sezení, 3-5 scén) a mít jasně daný konec.\n'
const promptAnnotation = 'Napiš jeden odstavec poutavého reklamního textu, který naláká hráče k zahrání této hry. Zaměř se na atmosféru a hlavní témata příběhu.\n'
const promptImage = 'Napiš prosím prompt pro vygenerování poutavého ilustračního obrázku který vystihne atmosféru a estetiku této hry a jejího tématu. Maximální délka tohoto je 480 tokenů.\n'

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
/*
function getContext (conceptData, exclude) {
  const context = {
    basePrompt: getBasePrompt(conceptData),
    storyWorld: { text: conceptData.storyWorld },
    storyFactions: { text: conceptData.storyFactions },
    storyLocations: { text: conceptData.storyLocations },
    storyCharacters: { text: conceptData.storyCharacters },
    storyProtagonist: { text: conceptData.storyProtagonist },
    storyAnnotation: { text: conceptData.storyAnnotation },
    storyPlan: { text: conceptData.storyPlan }
  }
  delete context[exclude]
  return Object.values(context)
}
*/

export async function generateSoloConcept (conceptData) {
  const safetySettings = [
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
  ]
  const aiConfig = { model: 'gemini-2.5-flash-preview-05-20', config: { safetySettings } }

  // World
  const messageWorld = { text: promptWorld }
  if (conceptData.prompt_world) { messageWorld.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_world}"` }
  aiConfig.contents = [getBasePrompt(conceptData), messageWorld]
  const response = await ai.models.generateContent(aiConfig)
  const generatedWorld = { text: response.text }

  // Factions
  const messageFactions = { text: promptFactions }
  if (conceptData.prompt_factions) { messageFactions.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_factions}"` }
  aiConfig.contents = [getBasePrompt(conceptData), messageWorld, generatedWorld, messageFactions]
  const factionsResponse = await ai.models.generateContent(aiConfig)
  const generatedFactions = { text: factionsResponse.text }

  // Locations
  const messageLocations = { text: promptLocations }
  if (conceptData.prompt_locations) { messageLocations.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_locations}"` }
  aiConfig.contents = [getBasePrompt(conceptData), messageWorld, generatedWorld, messageFactions, generatedFactions, messageLocations]
  const locationsResponse = await ai.models.generateContent(aiConfig)
  const generatedLocations = { text: locationsResponse.text }

  // Characters
  const messageCharacters = { text: promptCharacters }
  if (conceptData.prompt_characters) { messageCharacters.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_characters}"` }
  aiConfig.contents = [getBasePrompt(conceptData), messageWorld, generatedWorld, messageFactions, generatedFactions, messageLocations, generatedLocations, messageCharacters]
  const charactersResponse = await ai.models.generateContent(aiConfig)
  const generatedCharacters = { text: charactersResponse.text }

  // Protagonist
  const messageProtagonist = { text: promptProtagonist }
  if (conceptData.prompt_protagonist) { messageProtagonist.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_protagonist}"` }
  aiConfig.contents = [getBasePrompt(conceptData), messageWorld, generatedWorld, messageFactions, generatedFactions, messageLocations, generatedLocations, messageCharacters, generatedCharacters, messageProtagonist]
  const protagonistResponse = await ai.models.generateContent(aiConfig)
  const generatedProtagonist = { text: protagonistResponse.text }

  // Plan
  const messagePlan = { text: promptPlan }
  aiConfig.contents = [getBasePrompt(conceptData), messageWorld, generatedWorld, messageFactions, generatedFactions, messageLocations, generatedLocations, messageCharacters, generatedCharacters, messageProtagonist, generatedProtagonist, messagePlan]
  const planResponse = await ai.models.generateContent(aiConfig)
  const generatedPlan = { text: planResponse.text }

  // Annotation
  const messageAnnotation = { text: promptAnnotation }
  aiConfig.contents = [getBasePrompt(conceptData), messageWorld, generatedWorld, messageFactions, generatedFactions, messageLocations, generatedLocations, messageCharacters, generatedCharacters, messageProtagonist, generatedProtagonist, messagePlan, generatedPlan, messageAnnotation]
  const annotationResponse = await ai.models.generateContent(aiConfig)
  const generatedAnnotation = { text: annotationResponse.text }

  // Image prompt
  const messageImage = { text: promptImage }
  if (conceptData.prompt_image) { messageImage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_image}"` }
  aiConfig.contents = [getBasePrompt(conceptData), promptWorld, generatedWorld, messageFactions, generatedFactions, promptLocations, generatedLocations, promptCharacters, generatedCharacters, promptProtagonist, generatedProtagonist, promptPlan, generatedPlan, promptAnnotation, generatedAnnotation, messageImage]
  const imagePromptResponse = await ai.models.generateContent(aiConfig)
  const generatedImage = { text: imagePromptResponse.text }

  // Generate header image
  const headerImageBuffer = await generateHeaderImage(generatedImage)

  return {
    generatedWorld: generatedWorld.text,
    generatedFactions: generatedFactions.text,
    generatedLocations: generatedLocations.text,
    generatedCharacters: generatedCharacters.text,
    generatedProtagonist: generatedProtagonist.text,
    generatedPlan: generatedPlan.text,
    generatedAnnotation: generatedAnnotation.text,
    generatedImage: generatedImage.text,
    headerImageBuffer
  }
}

async function generateHeaderImage (imageMessage) {
  const imageResponse = await ai.models.generateImages({
    model: 'gemini-2.0-flash-preview-image-generation',
    prompt: imageMessage,
    config: { responseModalities: [Modality.IMAGE], safetyFilterLevel: 'BLOCK_NONE', numberOfImages: 1, aspectRatio: '16:9', includeRaiReason: true, personGeneration: 'allow_all' }
  })
  const headerImageBase64 = imageResponse?.generatedImages?.[0]?.image?.imageBytes
  const bufferImage = Buffer.from(headerImageBase64, 'base64')
  const croppedBuffer = cropImageBackEnd(bufferImage, 16 / 9, 1024, 576)
  return croppedBuffer
}
