
import { updateStoryteller } from '@lib/openai'

export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()

  if (locals.user.id === data.owner) { // check if user is the owner of the game
    const post = await updateStoryteller(data.storyteller, data.system, `\n\n Úvod do hry: ${data.intro} \n\n Herní informace: ${data.secrets}`)
    return new Response(JSON.stringify({ post }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi vlastníkem hry' }), { status: 500 })
  }
}
