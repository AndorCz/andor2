
import { supabase } from '@lib/database'
import { savePost } from '@lib/openai'

export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()
  if (locals.user.id) { // check if user is signed in
    const postData = { thread: data.thread, owner: data.owner, owner_type: data.ownerType, content: data.content }
    if (data.openAiThread) { // send to open ai thread
      const openAiPost = await savePost(data.openAiThread, data.content, data.character)
      console.log('openAiPost', openAiPost)
      postData.openai_post = openAiPost.id
    }
    // save to supabase
    const { error } = await supabase.from('posts').insert(postData)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
    return new Response('{}', { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi přihlášený. Záloha příspěvku: ' + data.post }), { status: 500 })
  }
}

export const DELETE = async ({ url, request }) => {
  const id = url.searchParams.get('id')
  if (!id) { return new Response(JSON.stringify({ error: 'Chybí id příspěvku' }), { status: 500 }) }
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
  return new Response('{}')
}
