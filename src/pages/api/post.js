
import { supabase } from '@lib/database'
import { savePost, editPost } from '@lib/openai'

export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()
  if (locals.user.id) { // check if user is signed in
    const postData = { thread: data.thread, owner: data.owner, owner_type: data.ownerType, content: data.content }
    if (data.openAiThread) { // send to open ai thread
      const openAiPost = await savePost(data.openAiThread, data.content, data.character)
      // console.log('openAiPost', openAiPost)
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
  const thread = url.searchParams.get('thread') // open ai thread
  if (!id) { return new Response(JSON.stringify({ error: 'Chybí id příspěvku' }), { status: 500 }) }
  const { data, error } = await supabase.from('posts').delete().eq('id', id).select().single()
  if (data.openai_post && thread) { // delete from open ai thread as well
    editPost(thread, data.openai_post, 'deleted')
  }
  if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
  return new Response('{}')
}
