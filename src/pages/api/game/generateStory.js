
import { generateStory } from '@lib/openai'

export const maxDuration = 300 // 5 minutes

export const POST = async ({ request, locals }) => {
  const data = await request.json()

  if (locals.user.id === data.owner) { // check if user is the owner of the game
    const story = await generateStory(data.name, data.annotation, data.prompt, data.system)
    // save to db
    const { error } = await locals.supabase.from('games').update({ story }).eq('id', data.game)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }

    return new Response(JSON.stringify({ story }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi vlastníkem hry' }), { status: 500 })
  }
}
