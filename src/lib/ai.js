
import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY })

export const createThread = async () => {
  const thread = await openai.beta.threads.create()
  return thread.id
}
