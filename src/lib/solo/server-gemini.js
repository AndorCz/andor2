import { isFilledArray } from '@lib/utils.js'
import { GoogleGenAI, Type } from '@google/genai'
import { illustrationStyleAffixes, storytellerInstructions, imageSafetyAffix } from '@lib/solo/solo'

export const getStorytellerParams = (concept) => {
  const illustrationStyleAffix = illustrationStyleAffixes[concept.illustration_style] || 'ink'
  return {
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
            description: 'Pokud se má vygenerovat obrázek pro novou scénu, postavu nebo předmět, přidej tento objekt. Pokud není potřeba žádný obrázek, vynechej celý objekt.',
            properties: {
              prompt: { type: Type.STRING, description: `Pokud hráč potkal novou postavu, získal významný předmět nebo se ocitl v nové scéně, napiš prompt pro AI generátor obrázků. Měl by být v angličtině a vystihnout vizuálně novou scénu, předmět či postavu. Buď velmi detailní zejména v popisu postav a herních předmětů. ${illustrationStyleAffix} ${imageSafetyAffix}` },
              type: { type: Type.STRING, enum: ['scene', 'npc', 'item'], description: 'Typ obrázku, který se má vygenerovat. Použij "scene" pro ilustraci scény, "npc" pro portrét NPC postavy, nebo "item" pro ilustraci významného předmětu.' }
            },
            required: ['prompt', 'type']
          },
          inventory: {
            type: Type.OBJECT,
            description: 'Pokud se má změnit inventář postavy, přidej tento objekt. Pokud se nic nezměnilo, vynechej celý objekt.',
            properties: {
              items: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Aktualizovaný seznam všech předmětů, které má postava v inventáři.' },
              change: { type: Type.STRING, description: 'Popis změny v inventáři, např. "Získal jsi meč", "Ztratil jsi klíč", "Našel jsi mapu". Pokud se nic nezměnilo, ponech prázdné.' }
            }
          },
          end: {
            type: Type.BOOLEAN,
            description: 'Pokud tímto příspěvkem hra skončila, nastav na true. Například pokud postava zemřela. Jinak ponech false, nebo pole vynechej.'
          }
        },
        required: ['post', 'character', 'scene']
      },
      systemInstruction: storytellerInstructions
    }
  }
}

export function getAI (env) {
  if (!env.PRIVATE_GEMINI) { console.error('API key for Gemini is not set in environment variables') }
  return new GoogleGenAI({ apiKey: env.PRIVATE_GEMINI })
}

export const fieldNames = { prompt_world: 'Svět', prompt_factions: 'Frakce', prompt_locations: 'Lokace', prompt_characters: 'Postavy', prompt_protagonist: 'Postava hráče', prompt_plan: 'Plán hry', prompt_header_image: 'Ilustrační obrázek', prompt_storyteller_image: 'Portrét vypravěče', protagonist_names: 'Jména postavy', annotation: 'Reklamní text', first_image: 'Obrázek první scény', protagonist_image: 'Portrét postavy', inventory: 'Inventář postavy' }

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
export function getContext (conceptData, exclude, characterName, inventory) {
  const context = {
    basePrompt: { text: `Hra se bude jmenovat "${decodeURIComponent(conceptData.name)}". Budou následovat podklady (setting) pro tuto hru.` },
    prompt_world: { text: `<h2>${fieldNames.prompt_world}</h2>\n${conceptData.generated_world}` },
    prompt_factions: { text: `<h2>${fieldNames.prompt_factions}</h2>\n${conceptData.generated_factions}` },
    prompt_locations: { text: `<h2>${fieldNames.prompt_locations}</h2>\n${conceptData.generated_locations}` },
    prompt_characters: { text: `<h2>${fieldNames.prompt_characters}</h2>\n${conceptData.generated_characters}` },
    prompt_protagonist: { text: `<h2>${fieldNames.prompt_protagonist}</h2>\n${conceptData.generated_protagonist}` }
  }
  if (characterName) { context.prompt_protagonist.text += `\nJméno postavy: ${characterName}\n` }
  if (isFilledArray(inventory)) { context.prompt_protagonist.text += `\nInventář: ${inventory.join(', ')}\n` }
  if (exclude) { delete context[exclude] }
  return Object.values(context).map(item => item.text).join('\n\n')
}
