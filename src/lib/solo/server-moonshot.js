import OpenAI from 'openai'

export const getStorytellerParams = () => {
  return { model: 'kimi-k2-0905-preview', response_format: { type: 'json_object' } }
}

export function getAI (env) {
  if (!env.MOONSHOT_API_KEY) { console.error('API key is not set in environment variables') }
  return new OpenAI({ apiKey: env.MOONSHOT_API_KEY, baseURL: 'https://api.moonshot.ai/v1' })
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
