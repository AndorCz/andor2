
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

const getResponse = async (threadId, assistantId) => {
  const run = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId })

  const maxDuration = 300000 // 5 minutes
  const pollInterval = 5000 // 5 seconds

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      const { status } = await openai.beta.threads.runs.retrieve(threadId, run.id)
      if (['cancelled', 'failed', 'completed', 'expired'].includes(status)) {
        clearInterval(intervalId)

        if (status === 'completed') {
          // get last message
          const { data } = await openai.beta.threads.messages.list(threadId, run.id)
          resolve(data[0].content[0].text.value)
        } else {
          reject(new Error('Operation failed'))
        }
      }
    }, pollInterval)

    setTimeout(() => {
      clearInterval(intervalId)
      reject(new Error('Operation timed out'))
    }, maxDuration)
  })
}

export const generateStory = async (prompt, system) => {
  try {
    const assistantId = getAssistant(system)
    const threadId = await createThread()

    // get the basic setting (place)
    await openai.beta.threads.messages.create(threadId, { role: 'user',
      content: `Vycházej z tohoto zadání pro hru: ${prompt}
        Nyní popiš první kategorii podkladů:
        1. Místo: Kde se hra odehrává? Kdy? Vypiš na jeden řádek stručně tyto dvě faktické informace. Na další řádek přidej jednu větu, která shrne zajímavé okolnosti tohoto místa a času ze zadání pro hru, nebo vymysli nějaké vlastní.`
    })
    const place = await getResponse(threadId, assistantId)

    // get factions
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: `2. Frakce: Popiš jaké frakce operují v dané lokaci a jaký je mezi nimi vztah. Kdo kontroluje jaké území, jaké mají cíle, plány a problémy.` })
    const factions = await getResponse(threadId, assistantId)

    // get characters
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: `3. Postavy: Popiš stručně 10 nejdůležitějších (nehráčských) postav příběhu. Začni nejvlivnějšími postavami a postupně pokračuj i na ty se kterými se hráči dostanou snáze do kontaktu. Na všech by měly být kladné i záporné vlastnosti. O každé postavě napiš stručně následující: Jak postava vypadá, jaké je národnosti, etnika, kultury, jak se odívá. K jaké frakci náleží, jaký má charakter, společenskou úlohu, stáří, vliv. Jak se jmenuje a kdo má pro ní případně jaké přezdívky. Zvol zajímavé (ale uvěřitelné) jméno, dobře zapamatovatelná, dobře sedící k charakteru a kultuře postavy. Její stručnou historii. Jaké má cíle a problémy. Jaké jsou její nejdůležitější vztahy.` })
    const characters = await getResponse(threadId, assistantId)

    // get locations
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: `4. Lokace: Popiš stručně 10 nejdůležitějších lokací příběhu. Základny frakcí, důležitá veřejná místa, útočiště, domovy, podniky, shromaždiště, apod. O každé lokaci napiš stručně následující: Oficiální název a případné alternativní názvy. Jak lokace vypadá, v jakém je stavu a kdo v ní bývá k nalezení (běžní občané, postavy, zvířata etc.). Kdo má případně lokaci pod kontrolou - frakce, postava.` })
    const locations = await getResponse(threadId, assistantId)

    // get story
    await openai.beta.threads.messages.create(threadId, { role: 'user', content: `5. Příběh: Navrhni tři body příběhu kterých se může vypravěč chytit. Úvod: Kde příběh začne, co dostane hráčské postavy dohromady a donutí je spolupracovat. Nastol ústřední konflikt, úkol, záhadu - ideálně vše zmíněné. Střed: K čemu se musí hráči dopracovat? Jaké obtíže budou muset překonat? Jaké nové problémy se objeví? Jaké nové prostředky budou moci získat? Jak vede problém či záhada hlouběji než si dosud mysleli? Závěr: Jaké je rozuzlení záhady a uspokojivý cíl příběhu? K jakému bodu se musí ultimátně dostat pro zdárné zakončení kampaně?` })
    const story = await getResponse(threadId, assistantId)

    // clear the thread and return all
    await openai.beta.threads.del(threadId)

    return [place, factions, characters, locations, story].join('\n\n')
  } catch (error) {
    console.error(error)
    return error
  }
}