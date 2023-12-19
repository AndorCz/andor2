
import { supabase } from '@lib/database'
import { savePost } from '@lib/openai'

export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()  

  if (locals.user.id) { // check if user is signed in
    // save to db  
    const { error } = await supabase.from('posts').insert({ thread: data.game, owner: data.character, owner_type: 'character', content: data.content })
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }

    // send to open ai thread
    // savePost(data.openAiThread, data.content, data.character)

    return new Response('{}', { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi přihlášený. Záloha příspěvku: ' + data.post }), { status: 500 })
  }
}
