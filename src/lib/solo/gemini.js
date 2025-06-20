import { getHash } from '@lib/utils'
import { cropImageBackEnd } from '@lib/solo/server-utils'
import { GoogleGenAI, Modality } from '@google/genai'

export const ai = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI })
export const safetySettings = [
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
]
export const aiConfigDefault = { model: 'gemini-2.5-flash-lite-preview-06-17', config: { safetySettings, thinkingConfig: { thinkingBudget: 0 } } }

export function getBasePrompt (conceptData) {
  return {
    text: `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
      Tvá úloha je napsat textové podklady pro hru. Výstupem každé zprávy musí být samotný text podkladů, formátovaný pomocí HTML značek, bez oslovení, úvodu nebo obalení do Markdown bloku.
      Pokud použiješ přímou řeč k hráči, buď neformální a tykej.
      Hra kterou připravujeme se jmenuje "${decodeURIComponent(conceptData.name)}"`
    // Postupně budeme připravovat podklady v těchto částech: 1. Svět, 2. Frakce, 3. Lokace, 4. Postavy, 5. Protagonista, 6. Plán hry. Důležité: V každé odpovědi zpracuj vždy jen jednu danou část, i kdyby byla velmi krátká. Každá jedna odpověď musí být samostatná kapitola podkladů.
  }
}

export const prompts = {
  world: '1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh.\n',
  factions: '2. Frakce: Jak je svět politicky uspořádaný? Popiš hlavní mocenské frakce tohoto světa a vztahy mezi nimi.\n',
  locations: '3. Lokace: Navrhni zajímavá místa kde by se mohl příběh odehrávat.\n',
  characters: '4. Postavy: Popiš konkrétně několik zajímavých postav které budou v příběhu vystupovat.\n',
  protagonist: '5. Protagonista: Napiš stručný text pro jednoho hráče (1on1 hra), který mu v jednom odstavci vysvětlí jakou postavu bude hrát. Jedna věta popisu vzhledu, seznam vybavení, seznam dovedností a jedna věta o nedávné minulosti. Osobnost a pohlaví bude na hráči samotném.\n',
  plan: '6. Plán hry: Připrav schematickou osnovu příběhu. Popiš plán tak, aby měla každá situace několik jasných východisek, které vždy posunou příběh do další scény. Příběh může i předčasně skončit smrtí postavy. Hra by měla být relativně krátká (jedno sezení, 3-5 scén) a mít jasně daný konec.\n',
  annotation: 'Napiš jeden odstavec poutavého reklamního textu, který naláká hráče k zahrání této hry. Zaměř se na atmosféru a hlavní témata příběhu. Výstup musí být plain-text, bez html.\n',
  image: 'Please write a prompt for AI to generate an illustration image for this game. Come up with an interesting motif that well describes the theme of the game, describe a visual style that captures its atmosphere and aesthetics. The output must be plain-text, in english, without html, single paragraph, maximum length 480 tokens.\n'
}

export async function generateSoloConcept (supabase, conceptData) {
  try {
    let error
    let contents

    console.log('Starting concept generation for:', conceptData.id)

    // World
    const worldMessage = { text: prompts.world }
    if (conceptData.prompt_world) { worldMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_world}"` }
    contents = [getBasePrompt(conceptData), worldMessage]
    const response = await ai.models.generateContent({ ...aiConfigDefault, contents })
    const generatedWorld = { text: response.text }
    const { error: updateErrorWorld } = await supabase.from('solo_concepts').update({ generated_world: generatedWorld.text }).eq('id', conceptData.id)
    if (updateErrorWorld) { throw new Error(updateErrorWorld.message) }
    // console.log('Generated world:', generatedWorld.text)

    // Factions
    const factionsMessage = { text: prompts.factions }
    if (conceptData.prompt_factions) { factionsMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_factions}"` }
    contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage]
    const factionsResponse = await ai.models.generateContent({ ...aiConfigDefault, contents })
    const generatedFactions = { text: factionsResponse.text }
    const { error: updateErrorFactions } = await supabase.from('solo_concepts').update({ generated_factions: generatedFactions.text }).eq('id', conceptData.id)
    if (updateErrorFactions) { throw new Error(updateErrorFactions.message) }
    // console.log('Generated factions:', generatedFactions.text)

    // Locations
    const locationsMessage = { text: prompts.locations }
    if (conceptData.prompt_locations) { locationsMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_locations}"` }
    contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage]
    const locationsResponse = await ai.models.generateContent({ ...aiConfigDefault, contents })
    const generatedLocations = { text: locationsResponse.text }
    const { error: updateErrorLocations } = await supabase.from('solo_concepts').update({ generated_locations: generatedLocations.text }).eq('id', conceptData.id)
    if (updateErrorLocations) { throw new Error(updateErrorLocations.message) }
    // console.log('Generated locations:', generatedLocations.text)

    // Characters
    const charactersMessage = { text: prompts.characters }
    if (conceptData.prompt_characters) { charactersMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_characters}"` }
    contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage]
    const charactersResponse = await ai.models.generateContent({ ...aiConfigDefault, contents })
    const generatedCharacters = { text: charactersResponse.text }
    const { error: updateErrorCharacters } = await supabase.from('solo_concepts').update({ generated_characters: generatedCharacters.text }).eq('id', conceptData.id)
    if (updateErrorCharacters) { throw new Error(updateErrorCharacters.message) }
    // console.log('Generated characters:', generatedCharacters.text)

    // Protagonist
    const protagonistMessage = { text: prompts.protagonist }
    if (conceptData.prompt_protagonist) { protagonistMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_protagonist}"` }
    contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage]
    const protagonistResponse = await ai.models.generateContent({ ...aiConfigDefault, contents })
    const generatedProtagonist = { text: protagonistResponse.text }
    const { error: updateErrorProtagonist } = await supabase.from('solo_concepts').update({ generated_protagonist: generatedProtagonist.text }).eq('id', conceptData.id)
    if (updateErrorProtagonist) { throw new Error(updateErrorProtagonist.message) }
    // console.log('Generated protagonist:', generatedProtagonist.text)

    // Plan
    const planMessage = { text: prompts.plan }
    if (conceptData.prompt_plan) { planMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_plan}"` }
    contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage, generatedProtagonist, planMessage]
    const ai2 = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI }) // workaround for getting previous parts again
    const planResponse = await ai2.models.generateContent({ ...aiConfigDefault, contents, config: { model: 'gemini-2.5-pro', safetySettings, thinkingConfig: { thinkingBudget: 1000 } } })
    const generatedPlan = { text: planResponse.text }
    const { error: updateErrorPlan } = await supabase.from('solo_concepts').update({ generated_plan: generatedPlan.text }).eq('id', conceptData.id)
    if (updateErrorPlan) { throw new Error(updateErrorPlan.message) }
    // console.log('Generated plan:', generatedPlan.text)

    // Annotation
    const annotationMessage = { text: prompts.annotation }
    contents = [getBasePrompt(conceptData), worldMessage, generatedWorld, factionsMessage, generatedFactions, locationsMessage, generatedLocations, charactersMessage, generatedCharacters, protagonistMessage, generatedProtagonist, planMessage, generatedPlan, annotationMessage]
    const annotationResponse = await ai.models.generateContent({ ...aiConfigDefault, contents })
    const generatedAnnotation = { text: annotationResponse.text }
    const { error: updateErrorAnnotation } = await supabase.from('solo_concepts').update({ annotation: generatedAnnotation.text }).eq('id', conceptData.id)
    if (updateErrorAnnotation) { throw new Error(updateErrorAnnotation.message) }
    // console.log('Generated annotation:', generatedAnnotation.text)

    // Image prompt
    const imageMessage = { text: prompts.image }
    if (conceptData.prompt_image) { imageMessage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_image}"` }
    contents = [`Následující text popisuje setting pro TTRPG hru pod názvem "${conceptData.name}":`, generatedAnnotation, imageMessage]
    const imagePromptResponse = await ai.models.generateContent({ ...aiConfigDefault, contents })
    const generatedImagePrompt = imagePromptResponse.text
    const { error: updateErrorImage } = await supabase.from('solo_concepts').update({ generated_image: generatedImagePrompt }).eq('id', conceptData.id)
    if (updateErrorImage) { throw new Error(updateErrorImage.message) }
    // console.log('Generated image prompt:', generatedImagePrompt)

    // Generate header image
    const { data: image, error: imageError } = await generateHeaderImage(generatedImagePrompt)
    if (imageError) { error = imageError.message }
    // console.log('Generated header image:', image ? 'Image generated successfully' : 'No image generated')
    if (image) {
      const { error: uploadError } = await supabase.storage.from('headers').upload(`solo-${conceptData.id}.png`, image, { contentType: 'image/jpg' })
      if (uploadError) { throw new Error(uploadError.message) }
    }

    // Release concept when generation completes
    const { error: updateError } = await supabase.from('solo_concepts').update({ generating: false, published: true, custom_header: getHash() }).eq('id', conceptData.id)
    if (updateError) { throw new Error(updateError.message) }
    // console.log('Concept generation completed and saved, concept id:', conceptData.id)

    return { error, data: { success: true } }
  } catch (error) {
    console.error('Error generating solo concept:', error)
    return { error: { message: 'Chyba při generování konceptu: ' + error.message } }
  }
}

export async function generateHeaderImage (prompt) {
  console.log('Generating header image with message:', prompt)
  try {
    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002', prompt, config: { responseModalities: [Modality.IMAGE], numberOfImages: 1, aspectRatio: '16:9', includeRaiReason: true }
    })
    console.log('Image generation response:', imageResponse)
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
