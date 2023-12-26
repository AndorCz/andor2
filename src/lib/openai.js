
import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY })

function getRPGInfo (system) {
  switch (system) {
    case 'drd1': return { description: 'Používá se klasický pravidlový systém Dračí Doupě verze 1.6.', world: 'Hraje se ve světě Asterion.', files: ['file-Ae5bz34Q9oFP1zMYTMW4cGNL', 'file-jdgppOijRhvDrnIDkoAfKD9T'], assistant: 'asst_6gqjKKSeSv4sQzQbPlUq1MEB' }
    case 'vampire5e': return { description: 'Používá se moderní pravidlový systém Vampire: The Masquerade 5th edition.', world: 'Hraje se ve světě World of Darkness.', files: ['file-zhLBtLjBySf747SVgEL6CgDx'], assistant: 'asst_JfGCZhLM4cDVZDXaXZVbV6gH' }
    default: return { description: '', world: '', assistant: 'asst_Kooknse2JxfLBmroyDEWXz6j' }
  }
}

const getBaseStorytellerInstructions = (rpgInfo) => {
  return `Jsi vypravěč (storyteller) pro TTRPG (tabletop role-playing) hru. Hraje se v českém jazyce. ${rpgInfo.description} ${rpgInfo.world}
    Tvým cílem je postupně utvářet zajímavý a uvěřitelný příběh, který budou hráči moci prožívat a dělat vlastní rozhodnutí o svých postavách. Budeš psát výstižné popisy zajímavých lokací a postav a ptát se hráčů co chtějí dělat. Jejich akce vyhodnotíš na základě informací o jejich postavách a popíšeš jaký měly efekt, ať už žádoucí, nežádoucí, či obojí. Budeš se snažit aby se všechny postavy zúčastnily dění každé scény. Pokud by dění logicky mohla ovlivnit postava které se ještě nevyjádřila, zakonči zprávu tučnou výzvou na daného hráče. Vyzvi tuto postavu jménem a dodej "Co chceš dělat?", nebo "Jak zareaguješ?", apod.
    Vždy piš na kvalitní literární úrovni, bez gramatických a stylistických chyb.
    Tvým cílem je aby se hráči dobře bavili, tedy aby se jejich postavy rozvíjely, měli zajímavé situace k řešení, tajemství k odhalení a cíle k naplnění. Dbej na logiku dané situace, motivace nehráčských postav které tvoříš a posouvej příběh dál.
    Může se stát že se v průběhu hry přidá nová postava. Představí se a na tobě bude vymyslet a popsat jak by se mohla do současného dění také dostat.
    Zůstaň vždy v roli vypravěče. Hráči popisují záměry svých postav, ale ty vyhodnotíš a popíšeš co se skutečně stalo. Neprozrazuj tajné informace (motivace, cíle, plány apod) o cizích postavách hráčům na požádání. Posuď jaké informace o postavě či místu jsou pravděpodobně veřejné a které soukromé. Soukromé informace o cizích postavách jsou jako vzácná měna, kterou hráčům vyplatíš za odměnu, pokud docílili příběhového opodstatnění pro získání dané informace.`
}

export async function createStoryteller (name, system) {
  const rpgInfo = getRPGInfo(system)
  const { id } = await openai.beta.assistants.create({ name, model: 'gpt-4-1106-preview', tools: [{ type: 'retrieval' }], instructions: getBaseStorytellerInstructions(rpgInfo), file_ids: rpgInfo.files })
  return id
}

export async function updateStoryteller (assistantId, system, newInstructions) {
  const rpgInfo = getRPGInfo(system)
  const instructions = getBaseStorytellerInstructions(rpgInfo) + '\n\n' + newInstructions
  const assistantData = await openai.beta.assistants.retrieve(assistantId)
  return await openai.beta.assistants.update(assistantId, { ...assistantData, instructions })
}

export async function createThread () {
  const { id } = await openai.beta.threads.create()
  return id
}

// Creates a run, waits for it to complete, and optionally returns the last message
async function processRun (threadId, assistantId, returnLastMessage = false) {
  const maxDuration = 300000 // 5 minutes
  const pollInterval = 5000 // 5 seconds
  const run = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId })
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        const { status } = await openai.beta.threads.runs.retrieve(threadId, run.id)
        if (!['cancelled', 'failed', 'completed', 'expired'].includes(status)) { return }
        clearInterval(intervalId)
        if (status !== 'completed') {
          reject(new Error('Operation failed'))
        } else {
          resolve(returnLastMessage ? (await openai.beta.threads.messages.list(threadId)).data[0].content[0].text.value : undefined)
        }
      } catch (error) {
        clearInterval(intervalId)
        reject(error)
      }
    }, pollInterval)

    setTimeout(() => {
      clearInterval(intervalId)
      reject(new Error('Operation timed out'))
    }, maxDuration)
  })
}

export async function getPosts ({ threadId, role, order = 'asc' }) {
  const messages = await openai.beta.threads.messages.list(threadId, { order })
  if (role) {
    return messages.data.filter(message => message.role === role)
      .map(assistantMessage => assistantMessage.content[0].text.value)
  } else {
    return messages
  }
}

export async function savePost (threadId, content, characterId) {
  return await openai.beta.threads.messages.create(threadId, { role: 'user', content, metadata: { characterId } })
}

export async function editPost (threadId, messageId, newContent) {
  const message = await openai.beta.threads.messages.update(threadId, messageId, { content: [{ type: 'text', text: { value: newContent } }] })
    .catch(error => console.error('openai api error: ', error))
  console.log('updated message', message)
  return message
}

export async function generateStory (prompt, system) {
  try {
    const rpgInfo = getRPGInfo(system)
    const threadId = await createThread()

    // write the basic setting (place)
    savePost(threadId, `Vycházej z tohoto zadání pro hru: ${prompt}
        Nyní popiš první kategorii podkladů:
        1. Místo: Kde se hra odehrává? Kdy? Vypiš na jeden řádek stručně tyto dvě faktické informace. Na další řádek přidej jednu větu kterou shrneš (či vymyslíš) aktuální setting a druhou větu o čem v kampani půjde.`
    )
    await processRun(threadId, rpgInfo.assistant)

    // write factions
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '2. Frakce: Popiš jaké frakce operují v dané lokaci a jaký je mezi nimi vztah. Kdo kontroluje jaké území, jaké mají cíle, plány a problémy.' })
    await processRun(threadId, rpgInfo.assistant)

    // write characters
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '3. Postavy: Popiš stručně 10 nejdůležitějších (nehráčských) postav příběhu. Začni nejvlivnějšími postavami a postupně pokračuj i na ty se kterými se hráči dostanou snáze do kontaktu. Na všech by měly být kladné i záporné vlastnosti. O každé postavě napiš stručně následující: Jak postava vypadá, jaké je národnosti, etnika, kultury, jak se odívá. K jaké frakci náleží, jaký má charakter, společenskou úlohu, stáří, vliv. Jak se jmenuje a kdo má pro ní případně jaké přezdívky. Zvol zajímavé (ale uvěřitelné) jméno, dobře zapamatovatelná, dobře sedící k charakteru a kultuře postavy. Její stručnou historii. Jaké má cíle a problémy. Jaké jsou její nejdůležitější vztahy.' })
    await processRun(threadId, rpgInfo.assistant)

    // write locations
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '4. Lokace: Popiš stručně 10 nejdůležitějších lokací příběhu. Základny frakcí, důležitá veřejná místa, útočiště, domovy, podniky, shromaždiště, apod. O každé lokaci napiš stručně následující: Oficiální název a případné alternativní názvy. Jak lokace vypadá, v jakém je stavu a kdo v ní bývá k nalezení (běžní občané, postavy, zvířata etc.). Kdo má případně lokaci pod kontrolou - frakce, postava.' })
    await processRun(threadId, rpgInfo.assistant)

    // write story
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '5. Příběh: Navrhni tři body příběhu kterých se může vypravěč chytit. Úvod: Kde příběh začne, co dostane hráčské postavy dohromady a donutí je spolupracovat. Nastol ústřední konflikt, úkol, záhadu - ideálně vše zmíněné. Střed: K čemu se musí hráči dopracovat? Jaké obtíže budou muset překonat? Jaké nové problémy se objeví? Jaké nové prostředky budou moci získat? Jak vede problém či záhada hlouběji než si dosud mysleli? Závěr: Jaké je rozuzlení záhady a uspokojivý cíl příběhu? K jakému bodu se musí ultimátně dostat pro zdárné zakončení kampaně? Buď konkrétní: Urči jaké postavy, předměty a lokace budou jakým způsobem důležité pro posun příběhu.' })
    await processRun(threadId, rpgInfo.assistant)

    // clear the thread and return all AI messages
    const responses = await getPosts({ threadId, role: 'assistant', order: 'asc' })

    await openai.beta.threads.del(threadId)
    return responses.join('\n\n')
  } catch (error) {
    console.error(error)
    return error
  }
}

export async function generatePost (thread, secrets, system) {
  try {
    /*
      This function should start the "run" of the openAI thread, get the input from the AI and return it into the textarea. AI post will then be deleted.
      The storyteller can edit it and on save it's sent it back to the openAI thread (ideally under the AI role) and at the same time to the supabase.
      For now, it cannot be implemented because it is not possible to delete posts from a thread. :(
    */
  } catch (error) {
    console.error(error)
    return error
  }
}
