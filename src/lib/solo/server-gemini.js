import { isFilledArray } from '@lib/utils.js'
import { GoogleGenAI, Type } from '@google/genai'

const imageSafetyAffix = 'Prompt nesmí obsahovat sebevražedný a explicitně sexuální obsah.'
const artStyleAffix = 'Styl by měla být profesionální digitální grafika, jako z ArtStation nebo koncept art AAA her.'
const illustrationStyleAffix = 'Přidej tento popis stylu: "Detailed black ink RPG book illustration on texture of aged parchment. Artwork rendered with fine linework, hatching, and cross-hatching. No coloring, no anime, no manga."'
export const prompts = {
  prompt_world: 'Napiš HTML: 1. Svět: Vytvoř prosím přehledný a inspirativní popis fiktivního světa pro hráče RPG her. Zahrň: základní koncept a atmosféru světa, společenské uspořádání a kultury, roli magie, technologií a víry, stručnou geografii, stručné dějiny a legendy. Cílem je, aby měl vypravěč rychle dobrou představu jak v takovém světě vytvořit zajímavý příběh. \n',
  prompt_factions: 'Napiš HTML: 2. Frakce: Jak je svět politicky uspořádaný? Popiš hlavní mocenské frakce tohoto světa a vztahy mezi nimi.\n',
  prompt_locations: 'Napiš HTML: 3. Lokace: Navrhni zajímavá místa kde by se mohl příběh odehrávat.\n',
  prompt_characters: 'Napiš HTML: 4. Postavy: Popiš konkrétně několik zajímavých NPC postav které mohou v příběhu vystupovat.\n',
  prompt_protagonist: 'Napiš HTML: 5. Protagonista: Napiš stručný text pro jednoho hráče (1on1 hra), který mu v jednom odstavci vysvětlí jakou postavu bude hrát. Jeden odstavec popisu vzhledu, seznam dovedností a nakonec krátký odstavec o nedávné minulosti. Osobnost a pohlaví bude na hráči samotném.\n',
  prompt_plan: 'Napiš HTML: 6. Plán hry: Připrav schematickou osnovu příběhu. Popiš plán tak, aby měla každá situace několik jasných východisek, které vždy posunou příběh do další scény. Příběh může i předčasně skončit smrtí postavy. Hra by měla být relativně krátká (jedno sezení, 3-5 scén) a mít jasně daný konec.\n',
  prompt_header_image: `Napiš plaintext: AI prompt k vygenerování ilustračního obrázku pro tuto hru. Vymysli zajímavý motiv, který dobře popisuje téma hry, popiš vizuální styl, který vystihuje její atmosféru a estetiku. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. ${artStyleAffix} ${imageSafetyAffix} \n`,
  prompt_storyteller_image: `Napiš plaintext: AI prompt k vygenerování portrétu pro NPC vypravěče této TTRPG hry. Obrázek by měl být ve stejném stylu jako hlavní obrázek hry a měl by být portrétem tajemné siluety, někoho, kdo by mohl být skrytou božskou bytostí v tomto světě. Duch, prázdný plášť, létající světlo, mrak, digitální bytost jako z Matrixu atd. Cokoliv, co se hodí k tématu hry. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. ${artStyleAffix} ${imageSafetyAffix}\n`,
  protagonist_names: 'Napiš plaintext: 10 různorodých jmen pro postavu, kterou bude hráč hrát. Čtyři jména jasně mužská, čtyři jasně ženská, dvě neutrální. Jména by měla by ladit s atmosférou světa. Použij buď jazyky daného světa, nebo stylová jména česká. Jména by měla být většinou včetně příjmení, s přezdívkou, výjimečně jen jedno jméno samotné.\n',
  inventory: 'Napiš plaintext: Seznam vybavení hlavní postavy (jasný a definitivní, žádné "nebo") - co by měla postava nést s sebou na začátku hry. Seznam by měl obsahovat 5-15 položek, které sedí k původu či povolání postavy, zásadní pro její přežití, nebo jsou podstatné pro příběh. Zohledni přinejmenším tyto možnosti: platidla, oblečení, výzbroj (zbroje, zbraně, munice etc), cestovní vybavení (voda, jídlo, léky etc), dopravní prostředky, zvířata, osobní předměty, questové předměty. \n',
  annotation: 'Napiš plaintext: Jeden odstavec poutavého reklamního textu, který naláká hráče k zahrání této hry. Zaměř se na atmosféru a hlavní témata příběhu. Výstup musí být plaintext, bez HTML a CSS stylů.\n',
  first_image: `Napiš plaintext: AI prompt k vygenerování ilustračního obrázku pro první scénu této hry. Obrázek by měl zachytit podstatu první scény, ukazovat její charakteristické rysy a atmosféru. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. ${illustrationStyleAffix} ${imageSafetyAffix}\n`,
  protagonist_image: `Napiš plaintext: AI prompt k vygenerování portrétu hráčské postavy v TTRPG hře. Obrázek by měl zachytit podstatu postavy, ukazovat její charakteristické rysy a oděv. Výstup musí být prostý text, v angličtině, bez HTML, jeden odstavec, maximální délka 480 tokenů. ${artStyleAffix} ${imageSafetyAffix}\n`,
  firstPost: 'Napiš stručný a poutavý první příspěvek hry, který hráče uvede do příběhu. Vycházej z poskytnutého plánu hry. Pokud bude postava venku, nezapomeň zmínit roční období nebo aktuální počasí. Určitě přidej úvodní obrázek scény.'
}
export const assistantInstructions = 'Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce. Tvá úloha je napsat textové podklady pro hru. Důležité: Výstupem každé zprávy musí být samotný text podkladů. Nesmí obsahovat absolutně žádný jiný text ani formátování okolo. Pokud použiješ přímou řeč k hráči, buď neformální a tykej. Pokud je zadání "Napiš HTML", odpověz POUZE a VÝHRADNĚ blokem HTML kódu, žádné CSS ani markdown obalení. Ne celou stránku včetně hlavičky, jen obsah který bude vložen do existující stránky. Tvá odpověď nesmí obsahovat ŽÁDNÝ markdown. Pokud je zadání "Napiš plaintext", odpověz POUZE a VÝHRADNĚ čistým textem, bez HTML kódu. '
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

Herní styl: Hra je pro jednoho hráče, v češtině. Hraje se bez pravidel, čistý roleplaying. Ty (vypravěč) rozhoduješ o všem způsobem, který je realistický a vede buď k zajímavému pokračování, nebo k ukončení hry. Neexistuje žádný herní systém, jen příběh, postavy a rozhodnutí.

Výstup: Piš vždy v HTML formátu, ale používej jen základní tagy: <i> pro myšlenky a <b> pro přímou řeč. Žádné nadpisy, seznamy, odkazy, emoji ani CSS.

Literární styl:
- Piš v krátkých odstavcích po 2–3 větách.
- Pokud je třeba pohnout dějem dopředu, napiš 3–5 odstavců (expozice, přesun, náhlá událost).
- Pokud hráč právě interaguje s NPC, napiš 1–2 odstavce, aby mohl snadno reagovat.
- **Akční popisy a dialogy by měly být úderné a krátké. Expozice může být o něco delší, ale vždy udržuj tempo hry.**

Reaktivita:
- Obsah příspěvku hráče neopakuj, jen pokud obsahuje akce které nemají jistý výsledek, potvrď zdali se povedly či ne. Ignoruj pokud hráč výsledek sám popsal, tento text neplatí a potrestej ho neúspěchem takové akce. Pro vyhodnocení posuď logiku schopností postavy a příprav které podnikla. Pokud rozhoduje náhoda, vol ve prospěch zajímavosti vývoje příběhu.
- Pokud hráč opakovaně popisuje výsledek nejistých akcí, napiš mu poznámku pod příspěvkem, že v této hře o úspěchu nejistých akcí rozhoduje vypravěč a ne hráč. Je možné že jde o nováčka a potřebuje vysvětlení jak hru správně hrát.
- **Nebuď na postavu měkký. Postavy ve světě mohou být skeptické, nepříjemné, zlé, nedůvěřivé, lživé a jednat proti němu. Hráč nemá privilegia – svět se neohýbá podle něj.**
- Nikdy neprozrazuj plán, nebo záměr příběhu. Jediná výjimka je pokud příspěvek hráče začíná slovem "debug".
- **Každý příspěvek by měl končit dějovým podnětem, nebo dramatickým momentem, který hráče vybízí k reakci. Vyhni se "mrtvým koncům", kdy není zřejmé, s čím nebo kým může hráč interagovat, nebo nemá volbu kam může jít.**
- Nikdy ale nepiš explicitní seznam akcí, které může hráč udělat. Popiš jen situaci a v případě expozice možné cesty.
- Pokud hráč jedná nelogicky, zbrkle, nebo má postava smůlu, nebo udělá nebezpečné rozhodnutí, může to vést ke zranění nebo smrti postavy a ukončení hry.
- Pokud hráč píše mimo roli, napiš mu poznámku pod příspěvkem že ho upozorňuješ, že by měl psát v roli své postavy a daného příběhu. Pokud to bude opakovat, vymysli nějakou trestnou událost, která postavu donutí přehodnotit své chování, nebo postavu zabij a ukonči hru.

Obrázky:
Přidej obrázek jen pokud:
- Příběh mění scénu (nové prostředí, významná událost)
- Hráč potká novou postavu
- Hráč získá významný předmět
- Podnětem pro hráče je navigace v prostoru a pomohla by mu mapa, nebo plánek
Obrázek dej do objektu "image". Do "prompt" napiš popis v angličtině (vhodný pro generativní AI model). Typ obrázku zvol "scene", "npc" nebo "item" – podle kontextu. Jen jeden obrázek na odpověď. Pokud má být na obrázku více subjektů, spoj je do jednoho promptu typu "scene".

Inventář:
Pokud hráč něco získá, ztratí nebo se změní stav inventáře, přidej objekt "inventory". Vyplň "inventory.items" (aktuální seznam) a "inventory.change" (stručný popis změny). Pokud se nic nezměnilo, pole "inventory" vynech.
Pokud inventář v kontextu chybí, vypiš "<p class='info'>Inventář není k dispozici, pokračuji improvizací</p>".

Plán hry:
Tvým cílem je vést příběh podle "Plánu hry". Každá odpověď by měla postavu nenápadně vést k další scéně. **Improvizuj, pokud hráč udělá něco nečekaného, ale drž se plánu a zároveň udržuj napětí.**
Pokud plán hry v kontextu chybí, vypiš "<p class='info'>Plán hry není k dispozici, pokračuji improvizací</p>".

Konec hry:
Pokud postava zemře nebo příběh skončí, nastav "end" na true. Jinak pole vynech.`

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
          description: 'Pokud se má vygenerovat obrázek pro novou scénu, postavu nebo předmět, přidej tento objekt. Pokud není potřeba žádný obrázek, vynechej celý objekt.',
          properties: {
            prompt: { type: Type.STRING, description: `Pokud hráč potkal novou postavu, získal významný předmět nebo se ocitl v nové scéně, napiš prompt pro AI generátor obrázků. Měl by být v angličtině a vystihnout vizuálně novou scénu, předmět či postavu. ${illustrationStyleAffix} ${imageSafetyAffix}` },
            type: { type: Type.STRING, enum: ['scene', 'npc', 'item'], description: 'Typ obrázku, který se má vygenerovat. Použij "scene" pro ilustraci scény, "npc" pro portrét NPC postavy, nebo "item" pro ilustraci významného předmětu.' }
          },
          required: ['prompt', 'type']
        },
        inventory: {
          type: Type.OBJECT,
          description: 'Pokud se má změnit inventář postavy, přidej tento objekt. Pokud se nic nezměnilo, vynechej celý objekt.',
          properties: {
            items: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Aktualizovaný seznam předmětů, které má postava v inventáři.' },
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

export function getAI (env) {
  if (!env.PRIVATE_GEMINI) { console.error('API key for Gemini is not set in environment variables') }
  return new GoogleGenAI({ apiKey: env.PRIVATE_GEMINI })
  // try {
  // } catch (error) {
  //   return { error: `Chyba při inicializaci AI: ${error.message}` }
  // }
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
