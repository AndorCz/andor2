import { getOpenAI, generatePortrait } from '@lib/openai'

export const maxDuration = 300 // 5 minutes

export const POST = async ({ request, locals }) => {
  const data = await request.json()
  const openai = getOpenAI(locals.runtime.env)
  const res = await generatePortrait(openai, data.appearance, data.userId)
  if (res.message && res.stack) { return new Response(JSON.stringify({ error: res.message }), { status: 500 }) }
  return new Response(res, { status: 200 })
}
