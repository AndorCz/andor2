import { generatePortrait } from '@lib/server/replicate'

export const maxDuration = 300 // 5 minutes

export const POST = async ({ url, request, locals }) => {
  const data = await request.json()
  if (!locals.user.id) { return new Response(JSON.stringify({ error: 'Chybí přihlášení' }), { status: 500 }) }
  const res = await generatePortrait(locals.runtime.env, data.appearance)
  if (res.error) { return new Response(JSON.stringify({ error: res.error.message }), { status: 500 }) }
  return new Response(res.data, { status: 200 })
}
