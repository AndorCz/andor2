import OpenAI from 'openai'

/*
  The OpenAI assistant only has certain instructions and holds files that it can use for generation with Retrieval Augmented Generation.
  Storyteller:
    A. Should the instructions hold the game info, then every game has to have its own assistant
    B. Otherwise just every RPG system needs to have its own assistant
  Storyteller's assistant: Generate a new assistant for each output and delete it after generation.
*/

export const openai = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY })

export async function getStoryteller (system) {
  switch (system) {
    case 'drd1': return 'asst_gPyoxuM1NYnm7bBnRguSQRQu'
    case 'dnd5': return 'asst_VDTgVxxUkCdxBZcvddvfczO8'
    case 'vampire5': return 'asst_wO2eqDLudY0zt1CGt7AnFhEO'
    default: return 'asst_GKCXUy5gjeMvR2vo67XXP4bV' // base
  }
}

export async function createAssistant (name, system) {
  const { assistant: instructions, files } = await import(`../ai/${system}.js`)
  const { id } = await openai.beta.assistants.create({ name, model: 'gpt-4-1106-preview', tools: [{ type: 'retrieval' }], instructions, file_ids: files }).catch(error => { return error })
  return id
}

export async function createThread () {
  const { id } = await openai.beta.threads.create().catch(error => { return error })
  return id
}

// Creates a run, waits for it to complete, and optionally returns the last message
async function processRun (threadId, assistantId, returnLastMessage = false) {
  const maxDuration = 300000 // 5 minutes
  const pollInterval = 5000 // 5 seconds
  const run = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId }).catch(error => { return error })
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
  const messages = await openai.beta.threads.messages.list(threadId, { order }).catch(error => { return error })
  if (role) {
    return messages.data.filter(message => message.role === role)
      .map(assistantMessage => assistantMessage.content[0].text.value)
  } else {
    return messages
  }
}

export async function savePost (threadId, content, characterId) {
  return await openai.beta.threads.messages.create(threadId, { role: 'user', content, metadata: { characterId } }).catch(error => { return error })
}

export async function editPost (threadId, messageId, newContent) {
  return await openai.beta.threads.messages.update(threadId, messageId, { content: [{ type: 'text', text: { value: newContent } }] }).catch(error => { return error })
}

export async function generateStory (prompt, system) {
  try {
    const assistantId = await createAssistant('Temporary Assistant', system)
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

    // delete the thread and assistant
    await openai.beta.threads.del(threadId)
    await openai.beta.assistants.del(assistantId)

    return responses.join('\n\n')
  } catch (error) {
    console.error(error)
    return error
  }
}

export async function generatePost (thread, prompt, system) {
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

export async function generatePortrait (appearance, user) {
  return await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Digital painting, no text, RPG character in full-length and background environment: ${appearance}`,
    size: '1024x1024',
    response_format: 'url',
    user // for cases of inappropriate content
  }).catch(error => { return error })
}

export async function generateMap (description, user) {
  return await openai.images.generate({
    model: 'dall-e-3',
    prompt: `D&D RPG map, digital painting, top-down view, dark background, tiled with square grid: ${description}`,
    size: '1024x1024',
    response_format: 'url',
    user // for cases of inappropriate content
  }).catch(error => { return error })
}
