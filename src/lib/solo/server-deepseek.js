import OpenAI from 'openai'

export const getChatParams = () => {
  return { model: 'deepseek-v4-flash', thinking: { type: 'disabled' } }
}

export const getStorytellerParams = () => {
  return { ...getChatParams(), response_format: { type: 'json_object' }, max_tokens: 8192 }
}

export function getAI (env) {
  if (!env.DEEPSEEK_API_KEY) { console.error('DeepSeek API key is not set in environment variables') }
  return new OpenAI({ apiKey: env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' })
}

export async function getReadableStream (completion) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start (controller) {
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content
        if (content) { controller.enqueue(encoder.encode(content)) }
      }
      controller.close()
    }
  })
  return stream
}
