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
