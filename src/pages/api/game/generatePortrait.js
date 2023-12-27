
import { generatePortrait } from '@lib/openai'

export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()
  const portrait = await generatePortrait(data.appearance, data.userId)
  return new Response(JSON.stringify(portrait), { status: 200 })
}
