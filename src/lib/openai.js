import OpenAI from 'openai'

/*
  The OpenAI assistant only has certain instructions and holds files that it can use for generation with Retrieval Augmented Generation.
  Storyteller:
    A. Should the instructions hold the game info, then every game has to have its own assistant
    B. Otherwise just every RPG system needs to have its own assistant
  Storyteller's assistant: Generate a new assistant for each output and delete it after generation.
*/

export function getOpenAI (env) {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY })
}

export async function getStoryteller (system) {
  switch (system) {
    case 'drd1': return 'asst_gPyoxuM1NYnm7bBnRguSQRQu'
    case 'dnd5': return 'asst_VDTgVxxUkCdxBZcvddvfczO8'
    case 'vampire5': return 'asst_wO2eqDLudY0zt1CGt7AnFhEO'
    default: return 'asst_GKCXUy5gjeMvR2vo67XXP4bV' // base
  }
}

export async function createAssistant (openai, name, system = 'base') {
  const { assistant: instructions } = await import(`../ai/${system}.js`)
  const res = await openai.beta.assistants.create({ name, model: 'gpt-4o', instructions }).catch(error => { return error })
  if (res.error) { throw res.error }
  return res.id
}

export async function createThread (openai) {
  const res = await openai.beta.threads.create().catch(error => { return error })
  if (res.error) { throw res.error }
  return res.id
}

// Creates a run, waits for it to complete, and optionally returns the last message
export async function processRun (openai, threadId, assistantId, returnLastMessage = false) {
  const maxDuration = 600000 // 10 minutes
  const pollInterval = 5000 // 5 seconds
  const run = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId }).catch(error => { return error })
  if (run.error) { throw run.error }

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        const { status, error } = await openai.beta.threads.runs.retrieve(threadId, run.id)
        if (error) { reject(error) }

        if (!['cancelled', 'failed', 'completed', 'expired'].includes(status)) { return }
        clearInterval(intervalId)
        if (status !== 'completed') {
          reject(new Error('Operation failed'))
        } else {
          if (returnLastMessage) {
            const { data, error: listError } = await openai.beta.threads.messages.list(threadId)
            if (listError) { reject(listError) }
            resolve(data[0]?.content[0]?.text?.value)
          } else {
            resolve(true)
          }
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

export async function getPosts (openai, { threadId, role, order = 'asc' }) {
  const messages = await openai.beta.threads.messages.list(threadId, { order }).catch(error => { return error })
  if (messages.error) { throw messages.error }
  if (role) {
    return messages.data.filter(message => message.role === role)
      .map(assistantMessage => assistantMessage.content[0].text.value)
  } else {
    return messages
  }
}

export async function savePost (openai, threadId, content, characterId) {
  return await openai.beta.threads.messages.create(threadId, { role: 'user', content, metadata: { characterId } }).catch(error => { return error })
}

export async function editPost (openai, threadId, messageId, newContent) {
  return await openai.beta.threads.messages.update(threadId, messageId, { content: [{ type: 'text', text: { value: newContent } }] }).catch(error => { return error })
}

export async function generatePost (openai, thread, prompt, system) {
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

export async function generatePortrait (openai, appearance, user) {
  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Digital painting, no text, RPG character in full-length and background environment: ${appearance}`,
    size: '1024x1024',
    response_format: 'url',
    user // for cases of inappropriate content
  }).catch(error => { return error })

  const response = await fetch(image.data[0].url, { headers: { 'Access-Control-Allow-Origin': '*' } })
  const blob = await response.blob()
  return blob
}

export async function generateMap (openai, description, user) {
  return await openai.images.generate({
    model: 'dall-e-3',
    prompt: `D&D RPG map, digital painting, top-down view, dark background, tiled with square grid: ${description}`,
    size: '1024x1024',
    response_format: 'url',
    user // for cases of inappropriate content
  }).catch(error => { return error })
}
