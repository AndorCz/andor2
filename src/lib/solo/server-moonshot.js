import OpenAI from 'openai'

export const getStorytellerParams = () => {
  return { model: 'kimi-k2-0711-preview', response_format: { type: 'json_object' }, stream: true }
}

export function getAI (env) {
  if (!env.MOONSHOT_API_KEY) { console.error('API key is not set in environment variables') }
  return new OpenAI({ apiKey: env.MOONSHOT_API_KEY, baseURL: 'https://api.moonshot.ai/v1' })
}
