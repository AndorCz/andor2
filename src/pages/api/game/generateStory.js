
import { generateStory } from '@lib/openai'
import { supabase } from '@lib/database'

export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()  

  if (locals.user.id === data.owner) { // check if user is the owner of the game
    const story = await generateStory(data.intro, data.system)
    
    // save to db
    const { error } = await supabase.from('games').update({ secrets: story }).eq('id', data.game)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
    
    return new Response(JSON.stringify({ story }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi vlastníkem hry' }), { status: 500 })
  }
}
