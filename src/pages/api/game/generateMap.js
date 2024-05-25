import { getOpenAI, generateMap } from '@lib/openai'

export const maxDuration = 300 // 5 minutes

export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()
  const openai = getOpenAI(locals.runtime.env)
  const res = await generateMap(openai, data.description, data.userId)
  if (res.message && res.stack) { return new Response(JSON.stringify({ error: res.message }), { status: 500 }) }
  return new Response(JSON.stringify(res), { status: 200 })
}
