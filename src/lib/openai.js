
import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY })

export const createThread = async () => {
  const { id } = await openai.beta.threads.create()
  return id
}

const getAssistant = (system) => {
  switch (system) {
    case 'drd1': return 'asst_6gqjKKSeSv4sQzQbPlUq1MEB'
    case 'vampire5e': return 'asst_JfGCZhLM4cDVZDXaXZVbV6gH'
    case '-': return 'asst_Kooknse2JxfLBmroyDEWXz6j'
    default: return 'asst_Kooknse2JxfLBmroyDEWXz6j'
  }
}

const getStoryteller = (system) => {
  switch (system) {
    case 'drd1': return 'asst_CRxxTBltj9E8WPB0Cis37OlQ'
    case 'vampire5e': return 'asst_8mT2BO0r4lgV37CQHjPS2Ehp'
    case '-': return 'asst_MZGE6HVoCoelTCvJnKoESBpq'
    default: return 'asst_MZGE6HVoCoelTCvJnKoESBpq'
  }
}

const maxDuration = 300000 // 5 minutes
const pollInterval = 5000 // 5 seconds

// Creates a run, waits for it to complete, and optionally returns the last message
const processRun = async (threadId, assistantId, returnLastMessage = false) => {
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

export const getPosts = async ({ threadId, role, order = 'asc' }) => {
  const messages = await openai.beta.threads.messages.list(threadId, { order })
  if (role) {
    return messages.data.filter(message => message.role === role)
      .map(assistantMessage => assistantMessage.content[0].text.value)
  } else {
    return messages
  }
}

export const savePost = async (threadId, content, characterId) => {
  return await openai.beta.threads.messages.create(threadId, { role: 'user', content, metadata: { characterId } })
}

export const generateStory = async (prompt, system) => {
  try {
    const assistantId = getAssistant(system)
    const threadId = await createThread()

    // write the basic setting (place)
    savePost(threadId, `Vycházej z tohoto zadání pro hru: ${prompt}
        Nyní popiš první kategorii podkladů:
        1. Místo: Kde se hra odehrává? Kdy? Vypiš na jeden řádek stručně tyto dvě faktické informace. Na další řádek přidej jednu větu kterou shrneš (či vymyslíš) aktuální setting a druhou větu o čem v kampani půjde.`
    )
    await processRun(threadId, assistantId)

    // write factions
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '2. Frakce: Popiš jaké frakce operují v dané lokaci a jaký je mezi nimi vztah. Kdo kontroluje jaké území, jaké mají cíle, plány a problémy.' })
    await processRun(threadId, assistantId)

    // write characters
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '3. Postavy: Popiš stručně 10 nejdůležitějších (nehráčských) postav příběhu. Začni nejvlivnějšími postavami a postupně pokračuj i na ty se kterými se hráči dostanou snáze do kontaktu. Na všech by měly být kladné i záporné vlastnosti. O každé postavě napiš stručně následující: Jak postava vypadá, jaké je národnosti, etnika, kultury, jak se odívá. K jaké frakci náleží, jaký má charakter, společenskou úlohu, stáří, vliv. Jak se jmenuje a kdo má pro ní případně jaké přezdívky. Zvol zajímavé (ale uvěřitelné) jméno, dobře zapamatovatelná, dobře sedící k charakteru a kultuře postavy. Její stručnou historii. Jaké má cíle a problémy. Jaké jsou její nejdůležitější vztahy.' })
    await processRun(threadId, assistantId)

    // write locations
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '4. Lokace: Popiš stručně 10 nejdůležitějších lokací příběhu. Základny frakcí, důležitá veřejná místa, útočiště, domovy, podniky, shromaždiště, apod. O každé lokaci napiš stručně následující: Oficiální název a případné alternativní názvy. Jak lokace vypadá, v jakém je stavu a kdo v ní bývá k nalezení (běžní občané, postavy, zvířata etc.). Kdo má případně lokaci pod kontrolou - frakce, postava.' })
    await processRun(threadId, assistantId)

    // write story
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: '5. Příběh: Navrhni tři body příběhu kterých se může vypravěč chytit. Úvod: Kde příběh začne, co dostane hráčské postavy dohromady a donutí je spolupracovat. Nastol ústřední konflikt, úkol, záhadu - ideálně vše zmíněné. Střed: K čemu se musí hráči dopracovat? Jaké obtíže budou muset překonat? Jaké nové problémy se objeví? Jaké nové prostředky budou moci získat? Jak vede problém či záhada hlouběji než si dosud mysleli? Závěr: Jaké je rozuzlení záhady a uspokojivý cíl příběhu? K jakému bodu se musí ultimátně dostat pro zdárné zakončení kampaně? Buď konkrétní: Urči jaké postavy, předměty a lokace budou jakým způsobem důležité pro posun příběhu.' })
    await processRun(threadId, assistantId)

    // clear the thread and return all AI messages
    const responses = await getPosts({ threadId, role: 'assistant', order: 'asc' })

    await openai.beta.threads.del(threadId)
    return responses.join('\n\n')
  } catch (error) {
    console.error(error)
    return error
  }
}
