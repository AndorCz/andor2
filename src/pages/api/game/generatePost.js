
import { generatePost } from '@lib/openai'

export const POST = async ({ request, locals }) => {
  const data = await request.json()

  if (locals.user.id === data.owner) { // check if user is the owner of the game
    const post = await generatePost(data.thread, data.prompt, data.system)
    return new Response(JSON.stringify({ post }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi vlastníkem hry' }), { status: 500 })
  }
}
