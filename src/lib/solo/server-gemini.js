import { getHash } from '@lib/utils'
import { GoogleGenAI, Type } from '@google/genai'
import { generateImage } from '@lib/solo/server-aiml'
// import { cropImageBackEnd } from '@lib/solo/server-utils'

const imageSafetyAffix = 'Prompt nesmí obsahovat sebepoškozování a explicitně násilný či sexuální obsah.'
const imageStyleAffix = `Styl by měl být profesionální digitální grafika, jako z ArtStation nebo koncept art AAA her.`
export const prompts = {
  prompt_world: 'Napiš HTML: 1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh. \n',
  prompt_factions: 'Napiš HTML: 2. Frakce: Jak je svět politicky uspořádaný? Popiš hlavní mocenské frakce tohoto světa a vztahy mezi nimi.\n',
  prompt_locations: 'Napiš HTML: 3. Lokace: Navrhni zajímavá místa kde by se mohl příběh odehrávat.\n',
  prompt_characters: 'Napiš HTML: 4. Postavy: Popiš konkrétně několik zajímavých postav které budou v příběhu vystupovat.\n',
  prompt_protagonist: 'Napiš HTML: 5. Protagonista: Napiš stručný text pro jednoho hráče (1on1 hra), který mu v jednom odstavci vysvětlí jakou postavu bude hrát. Jeden odstavec popisu vzhledu, seznam dovedností a nakonec krátký odstavec o nedávné minulosti. Osobnost a pohlaví bude na hráči samotném.\n',
  prompt_plan: 'Napiš HTML: 6. Plán hry: Připrav schematickou osnovu příběhu. Popiš plán tak, aby měla každá situace několik jasných východisek, které vždy posunou příběh do další scény. Příběh může i předčasně skončit smrtí postavy. Hra by měla být relativně krátká (jedno sezení, 3-5 scén) a mít jasně daný konec.\n',

  prompt_header_image: `Napiš plaintext: AI prompt k vygenerování ilustračního obrázku pro tuto hru. Vymysli zajímavý motiv, který dobře popisuje téma hry, popiš vizuální styl, který vystihuje její atmosféru a estetiku. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. ${imageStyleAffix} ${imageSafetyAffix} \n`,
  prompt_storyteller_image: `Napiš plaintext: AI prompt k vygenerování portrétu pro NPC vypravěče této TTRPG hry. Obrázek by měl být ve stejném stylu jako hlavní obrázek hry a měl by být portrétem tajemné siluety, někoho, kdo by mohl být skrytou božskou bytostí v tomto světě. Duch, prázdný plášť, létající světlo, mrak, digitální bytost jako z Matrixu atd. Cokoliv, co se hodí k tématu hry. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. Styl by měl být profesionální digitální grafika, jako z ArtStation nebo koncept art AAA her. ${imageSafetyAffix}\n`,

  protagonist_names: 'Napiš plaintext: 10 různorodých jmen pro postavu, kterou bude hráč hrát. Čtyři jména jasně mužská, čtyři jasně ženská, dvě neutrální. Jména by měla by ladit s atmosférou světa. Použij buď jazyky daného světa, nebo stylová jména česká. Jména by měla být většinou včetně příjmení, s přezdívkou, výjimečně jen jedno jméno samotné.\n',
  inventory: 'Napiš plaintext: Seznam vybavení hlavní postavy (jasný a definitivní, žádné "nebo") - co by měla postava nést s sebou na začátku hry. Seznam by měl obsahovat 5-15 položek, které sedí k původu či povolání postavy, zásadní pro její přežití, nebo jsou podstatné pro příběh. Zohledni přinejmenším tyto možnosti: platidla, oblečení, výzbroj (zbroje, zbraně, munice etc), cestovní vybavení (voda, jídlo, léky etc), dopravní prostředky, zvířata, osobní předměty, questové předměty. \n',
  annotation: 'Napiš plaintext: Jeden odstavec poutavého reklamního textu, který naláká hráče k zahrání této hry. Zaměř se na atmosféru a hlavní témata příběhu. Výstup musí být plain-text, bez HTML.\n',
  first_image: `Napiš plaintext: AI prompt k vygenerování ilustračního obrázku pro první scénu této hry. Obrázek by měl zachytit podstatu první scény, ukazovat její charakteristické rysy a atmosféru. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. ${imageStyleAffix} ${imageSafetyAffix}\n`,
  protagonist_image: `Napiš plaintext: AI prompt k vygenerování portrétu hráčské postavy v TTRPG hře. Obrázek by měl zachytit podstatu postavy, ukazovat její charakteristické rysy a oděv. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. ${imageStyleAffix} ${imageSafetyAffix}\n`
}
export const fieldNames = { prompt_world: 'Svět', prompt_factions: 'Frakce', prompt_locations: 'Lokace', prompt_characters: 'Postavy', prompt_protagonist: 'Protagonista', prompt_plan: 'Plán hry', prompt_header_image: 'Ilustrační obrázek', prompt_storyteller_image: 'Portrét vypravěče', protagonist_names: 'Jména postavy', annotation: 'Reklamní text', first_image: 'Obrázek první scény', protagonist_image: 'Portrét postavy' }

export const ai = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI })
export const assistantInstructions = 'Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce. Tvá úloha je napsat textové podklady pro hru. Důležité: Výstupem každé zprávy musí být samotný text podkladů. Nesmí obsahovat absolutně žádný jiný text ani formátování okolo. Pokud použiješ přímou řeč k hráči, buď neformální a tykej. Pokud je zadání "Napiš HTML", odpověz POUZE a VÝHRADNĚ čistým HTML kódem. Tvá odpověď nesmí obsahovat markdown bloky. Pokud je zadání "Napiš plaintext", odpověz POUZE a VÝHRADNĚ čistým textem, bez HTML kódu. '
export const assistantParams = {
  model: 'gemini-2.5-flash-lite-preview-06-17',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    thinkingConfig: { thinkingBudget: 0 }, // fast response
    responseMimeType: 'text/plain',
    candidateCount: 1,
    systemInstruction: assistantInstructions
  }
}

export const storytellerInstructions = `Jsi vypravěč (storyteller nebo game-master) online TTRPG hry.
  Herní styl: Hra je pro jednoho hráče, v češtině. Hraje se bez pravidlového systému, čistý roleplaying, tedy vypravěč (ty) vše rozhodne způsobem který je realistický a vede buď k zajímavému pokračování příběhu, nebo konci hry.
  Výstup: Piš vždy v HTML formátu, ale používej jen základní tagy, jako kurzíva pro myšlenky a tučný text pro přímou řeč. Žádné nadpisy, odkazy, ikony, seznamy apod.
  Literární styl: Text vždy rozděluj do krátkých odstavců, po dvou až třech větách. Herní příspěvek by měl mít takovou délku, aby odpovídal příběhovým potřebám. Pokud je třeba děj posunout, aby měl hráč s čím pracovat, napiš až pět odstavců. Pokud je hráč v interakci s NPC, stačí dva odstavce, aby mohl hráč rychle reagovat. Nikdy nepiš explicitně možnosti co může hráč udělat.
  Zákaz: Nezačínej příspěvek opakováním toho co napsal hráč, není to užitečné. Na konec nikdy nepiš seznam možností co může udělat, hráč má svojí fantazii. Hlavně nikdy předem neprozrazuj plán příběhu, jedině pokud příspěvek začíná slovem "debug". Nikdy nepiš příspěvek delší než pět odstavců.
  Plán hry: Tvým cílem je vést hru podle připraveného plánu, který dostaneš v kontextu hry, sekci "Plán hry". Při přípravě každé odpovědi se zamysli nad tím, jak postavu co nejlépe nasměrovat k další scéně. Neboj se improvizovat, pokud hráč udělá něco nečekaného, ale vždy se snaž držet plánu hry a přitom udržet hru zábavnou a napínavou. Také se neboj postavu nechat zemřít, pokud udělá něco hloupého nebo nevyjde něco riskantního, případně pokud hráč vystupuje z role postavy.
  Obrázky: Vždy když příběh mění scénu, začíná nová příběhová kapitola, dej do výstupu objekt "image", pro přidání ilustračního obrázku dané věci do hry. Do pole "prompt" pak napiš profesionální prompt s popisem obrázku, bude vygenerován od obrázkového AI modelu. Ilustrace by měla ideálně vystihnout to co právě protagonista vidí: novou lokaci (type: "scene"), postavu (type: "npc") nebo předmět (type: "item"). Můžeš přidat pouze jeden obrázek na zprávu, takže pokud potřebuješ ukázat více subjektů, zkombinuj je do jednoho promptu obrázku typu "scene".
  Inventář: V kontextu hry budeš mít k dispozici inventář postavy. Pokud postava nějaký předmět ztratí, získá nebo se změní, aktualizuj pole "inventory.items" v odpovědi a změnu popiš v "inventory.change". Pokud postava nic nemá, pole je prázdné.
`
// Scény: Příběh se dělí na scény, které jsou zpravidla krátké, mají jasný cíl a vážou se na určitou lokaci.

export const storytellerParams = {
  model: 'gemini-2.5-pro',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    thinkingConfig: { thinkingBudget: 200 },
    candidateCount: 1,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        character: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Jméno postavy, z jejíž perspektivy je psán příspěvek. Pokud je postava vypravěč, použij "Vypravěč". Pokud je to jiná postava, použij její jméno.' },
            slug: { type: Type.STRING, enum: ['vypravec'], description: 'Slug je vždy jméno postavy malými písmeny, bez mezer a diakritiky. Můžeš použít slug která není v seznamu a nová postava bude vytvořena.' }
          },
          required: ['name', 'slug']
        },
        post: { type: Type.STRING, description: 'Příběhový příspěvek pro hráče, v HTML formátu' },
        scene: { type: Type.STRING, description: 'Vlastní název příběhové scény. Pojmenuj libovolně, ale poté drž stejný název dokud se scéna nezmění.' },
        image: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING, description: `Pokud je vhodné vygenerovat obrázek, napiš prompt pro AI generátor obrázků. Měl by být v angličtině a . Pokud není potřeba žádný obrázek, ponech prázdné. ${imageStyleAffix} ${imageSafetyAffix}` },
            type: { type: Type.STRING, enum: ['scene', 'npc', 'item'], description: 'Typ obrázku, který se má vygenerovat. Použij "scene" pro ilustraci scény, "npc" pro portrét NPC postavy, nebo "item" pro ilustraci významného předmětu.' }
          }
        },
        inventory: {
          type: Type.OBJECT,
          properties: {
            items: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Aktualizovaný seznam předmětů, které má postava v inventáři.' },
            change: { type: Type.STRING, description: 'Popis změny v inventáři, např. "Získal jsi meč", "Ztratil jsi klíč", "Našel jsi mapu". Pokud se nic nezměnilo, ponech prázdné.' }
          }
        }
      },
      required: ['post', 'character', 'scene']
    },
    systemInstruction: storytellerInstructions
  }
}

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
export function getContext (conceptData, exclude) {
  const context = {
    basePrompt: { text: `Hra se bude jmenovat "${decodeURIComponent(conceptData.name)}". Budou následovat podklady (setting) pro tuto hru.` },
    prompt_world: { text: conceptData.generated_world },
    prompt_factions: { text: conceptData.generated_factions },
    prompt_locations: { text: conceptData.generated_locations },
    prompt_characters: { text: conceptData.generated_characters },
    prompt_protagonist: { text: conceptData.generated_protagonist },
    inventory: { text: 'Inventář postavy: ' + conceptData.inventory.join(', ') }
  }
  if (exclude) { delete context[exclude] }
  return Object.values(context).map(item => item.text).join('\n\n')
}

export async function generateSoloConcept (supabase, conceptData) {
  try {
    const structuredConfig = { config: { responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }, responseMimeType: 'application/json' } }
    const basePrompt = { text: `Hra kterou připravujeme se jmenuje "${decodeURIComponent(conceptData.name)}"` }
    const chat = ai.chats.create({ ...assistantParams, history: [{ role: 'user', parts: [{ text: assistantInstructions }, basePrompt] }] })

    // World
    const promptWorld = { text: prompts.prompt_world }
    if (conceptData.prompt_world) { promptWorld.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_world}"` }
    const responseWorld = await chat.sendMessage({ message: promptWorld })
    const { error: updateErrorWorld } = await supabase.from('solo_concepts').update({ generated_world: responseWorld.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorWorld) { throw new Error(updateErrorWorld.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_world'), 1) // Done

    // Factions
    const promptFactions = { text: prompts.prompt_factions }
    if (conceptData.prompt_factions) { promptFactions.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_factions}"` }
    const responseFactions = await chat.sendMessage({ message: promptFactions })
    const { error: updateErrorFactions } = await supabase.from('solo_concepts').update({ generated_factions: responseFactions.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorFactions) { throw new Error(updateErrorFactions.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_factions'), 1) // Done

    // Locations
    const promptLocations = { text: prompts.prompt_locations }
    if (conceptData.prompt_locations) { promptLocations.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_locations}"` }
    const responseLocations = await chat.sendMessage({ message: promptLocations })
    const { error: updateErrorLocations } = await supabase.from('solo_concepts').update({ generated_locations: responseLocations.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorLocations) { throw new Error(updateErrorLocations.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_locations'), 1) // Done

    // Characters
    const promptCharacters = { text: prompts.prompt_characters }
    if (conceptData.prompt_characters) { promptCharacters.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_characters}"` }
    const responseCharacters = await chat.sendMessage({ message: promptCharacters })
    const { error: updateErrorCharacters } = await supabase.from('solo_concepts').update({ generated_characters: responseCharacters.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorCharacters) { throw new Error(updateErrorCharacters.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_characters'), 1) // Done

    // Protagonist
    const promptProtagonist = { text: prompts.prompt_protagonist }
    if (conceptData.prompt_protagonist) { promptProtagonist.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_protagonist}"` }
    const responseProtagonist = await chat.sendMessage({ message: promptProtagonist })
    const { error: updateErrorProtagonist } = await supabase.from('solo_concepts').update({ generated_protagonist: responseProtagonist.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorProtagonist) { throw new Error(updateErrorProtagonist.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_protagonist'), 1) // Done

    // Annotation
    const responseAnnotation = await chat.sendMessage({ message: prompts.annotation })
    const { error: updateErrorAnnotation } = await supabase.from('solo_concepts').update({ annotation: responseAnnotation.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorAnnotation) { throw new Error(updateErrorAnnotation.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('annotation'), 1) // Done

    // Header image prompt
    const promptHeaderImage = { text: prompts.prompt_header_image }
    if (conceptData.prompt_header_image) { promptHeaderImage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_header_image}"` }
    const responseHeaderImagePrompt = await chat.sendMessage({ message: promptHeaderImage })
    const { error: updateErrorImage } = await supabase.from('solo_concepts').update({ generated_header_image: responseHeaderImagePrompt.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorImage) { throw new Error(updateErrorImage.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_header_image'), 1) // Done

    // Storyteller image prompt
    const promptStorytellerImage = { text: prompts.prompt_storyteller_image }
    if (conceptData.prompt_storyteller_image) { promptStorytellerImage.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_storyteller_image}"` }
    const responseStorytellerImagePrompt = await chat.sendMessage({ message: promptStorytellerImage })
    const { error: updateErrorStorytellerImage } = await supabase.from('solo_concepts').update({ generated_storyteller_image: responseStorytellerImagePrompt.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorStorytellerImage) { throw new Error(updateErrorStorytellerImage.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_storyteller_image'), 1) // Done

    // Add storyteller npc
    const gameSlug = conceptData.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '')
    const npc = { name: 'Vypravěč', slug: `vypravec-${gameSlug}`, solo_concept: conceptData.id, storyteller: true, created_at: new Date(), portrait: getHash() }
    const { data: npcData, error: npcError } = await supabase.from('npcs').insert(npc).select().single()
    if (npcError) { throw new Error(npcError.message) }

    // Header image
    const { data: headerImage, error: headerImageError } = await generateImage(responseHeaderImagePrompt.text, 1100, 226)
    if (headerImageError) { throw new Error(headerImageError.message) }
    if (headerImage) {
      const { error: headerUploadError } = await supabase.storage.from('headers').upload(`solo-${conceptData.id}.jpg`, headerImage, { contentType: 'image/jpg' })
      if (headerUploadError) { throw new Error(headerUploadError.message) }
    }
    conceptData.generating.splice(conceptData.generating.indexOf('header_image'), 1) // Done

    // Storyteller image
    const { data: storytellerImage, error: storytellerImageError } = await generateImage(responseStorytellerImagePrompt.text, 140, 352) // generated size is 768x1408
    if (storytellerImageError) { throw new Error(storytellerImageError.message) }
    if (storytellerImage) {
      const { error: storytellerUploadError } = await supabase.storage.from('portraits').upload(`${npcData.id}.jpg`, storytellerImage, { contentType: 'image/jpg' })
      if (storytellerUploadError) { throw new Error(storytellerUploadError.message) }
    }
    conceptData.generating.splice(conceptData.generating.indexOf('storyteller_image'), 1) // Done

    // Protagonist names
    const protagonistContents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${conceptData.name}":` }, { text: responseWorld.text }, { text: responseProtagonist.text }, { text: prompts.protagonist_names }]
    const protagonistNamesResponse = await ai.models.generateContent({ ...assistantParams, ...structuredConfig, contents: protagonistContents })
    const { error: updateErrorProtagonistNames } = await supabase.from('solo_concepts').update({ protagonist_names: JSON.parse(protagonistNamesResponse.text), generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorProtagonistNames) { throw new Error(updateErrorProtagonistNames.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('protagonist_names'), 1) // Done

    // Inventory
    const inventoryContents = [{ text: `Následující text popisuje setting pro TTRPG hru pod názvem "${conceptData.name}":` }, { text: responseWorld.text }, { text: responseProtagonist.text }, { text: prompts.inventory }]
    const inventoryResponse = await ai.models.generateContent({ ...assistantParams, ...structuredConfig, contents: inventoryContents })
    const { error: updateErrorInventory } = await supabase.from('solo_concepts').update({ inventory: JSON.parse(inventoryResponse.text), generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorInventory) { throw new Error(updateErrorInventory.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('inventory'), 1) // Done

    // Plan
    const planConfig = { config: { ...assistantParams.config, thinkingConfig: { thinkingBudget: 1000 } } }
    const promptPlan = { text: prompts.prompt_plan }
    if (conceptData.prompt_plan) { promptPlan.text += `Vypravěč uvedl toto zadání: "${conceptData.prompt_plan}"` }
    const planContents = [basePrompt, { text: responseWorld.text }, { text: responseFactions.text }, { text: responseLocations.text }, { text: responseCharacters.text }, { text: responseProtagonist.text }, promptPlan]
    const ai2 = new GoogleGenAI({ apiKey: import.meta.env.PRIVATE_GEMINI }) // workaround for getting previous parts again
    const planResponse = await ai2.models.generateContent({ ...assistantParams, ...planConfig, contents: planContents, model: 'gemini-2.5-pro' })
    const generatedPlan = { text: planResponse.text }
    const { error: updateErrorPlan } = await supabase.from('solo_concepts').update({ generated_plan: generatedPlan.text, generating: conceptData.generating }).eq('id', conceptData.id)
    if (updateErrorPlan) { throw new Error(updateErrorPlan.message) }
    conceptData.generating.splice(conceptData.generating.indexOf('generated_plan'), 1) // Done

    // Release concept when generation completes
    const { error: updateError } = await supabase.from('solo_concepts').update({ published: true, generating: conceptData.generating, custom_header: getHash(), storyteller: npcData.id }).eq('id', conceptData.id)
    if (updateError) { throw new Error(updateError.message) }

    return { data: { success: true } }
  } catch (error) {
    console.error('Error generating solo concept:', error)
    return { error: { message: 'Chyba při generování konceptu: ' + error.message } }
  }
}
