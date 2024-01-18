
// import { savePost, editPost } from '@lib/openai'
import { isFilledArray } from '@lib/utils'

// get all posts

export const GET = async ({ url, request, locals }) => {
  const { thread, game, owners, limit = 0, offset = 100 } = Object.fromEntries(url.searchParams)
  const filterOwners = owners && isFilledArray(JSON.parse(owners)) ? JSON.parse(owners) : null
  let res, posts, count
  if (game) { // handle game threads
    res = await locals.supabase.rpc('get_game_posts', { thread_id: thread, game_id: game, owners: filterOwners, _limit: limit, _offset: offset })
    if (res.error) { return new Response(JSON.stringify({ error: res.error.message }), { status: 500 }) }
    posts = res.data.posts
    count = res.data.count
  } else { // handle other threads
    const query = locals.supabase.from('posts_owner').select('*', { count: 'exact' }).eq('thread', game).range(offset, offset + limit)
    if (filterOwners) { query.in('owner', filterOwners) } // add your posts
    query.order('created_at', { ascending: false })
    res = await query
    if (res.error) { return new Response(JSON.stringify({ error: res.error.message }), { status: 500 }) }
    posts = res.data
    count = res.count
  }
  return new Response(JSON.stringify({ posts, count }), { status: 200 })
}

// add new post
export const POST = async ({ request, redirect, locals }) => {
  const data = await request.json()
  if (locals.user.id) { // check if user is signed in
    const postData = { thread: data.thread, owner: data.owner, owner_type: data.ownerType, content: data.content, audience: data.audience }
    if (data.openAiThread) { // send to open ai thread
      // UNCOMMENT ONCE POST EDITING IS ALLOWED
      // const openAiPost = await savePost(data.openAiThread, data.content, data.character)
      // postData.openai_post = openAiPost.id
    }
    // save to supabase
    const { error } = await locals.supabase.from('posts').insert(postData)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
    return new Response('{}', { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi přihlášený. Záloha příspěvku: ' + data.post }), { status: 500 })
  }
}

// update post
export const PATCH = async ({ url, request, locals }) => {
  const data = await request.json()
  if (data.id) {
    if (locals.user.id) { // check if user is signed in
      const postData = data.moderate ? { moderated: true } : { thread: data.thread, owner: data.owner, owner_type: data.ownerType, content: data.content, audience: data.audience, moderated: data.moderated }
      if (data.openAiThread) { // update in open ai thread
        // 2DO: IMPLEMENT ONCE POST EDITING IS ALLOWED
      }
      // save to supabase
      const { error } = await locals.supabase.from('posts').update(postData).eq('id', data.id)
      if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
      return new Response('{}', { status: 200 })
    } else {
      return new Response(JSON.stringify({ error: 'Nejsi přihlášený. Záloha příspěvku: ' + data.post }), { status: 500 })
    }
  } else {
    return new Response(JSON.stringify({ error: 'Chybí id příspěvku' }), { status: 500 })
  }
}

// delete post
export const DELETE = async ({ url, request, locals }) => {
  const id = url.searchParams.get('id')
  const thread = url.searchParams.get('thread') // open ai thread
  if (!id) { return new Response(JSON.stringify({ error: 'Chybí id příspěvku' }), { status: 500 }) }
  const { data, error } = await locals.supabase.from('posts').delete().eq('id', id).select().single()
  if (data.openai_post && thread) { // delete from open ai thread as well
    // 2DO: STUCK - API doesn't allow to edit content of posts
    // editPost(thread, data.openai_post, 'deleted')
  }
  if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
  return new Response('{}')
}
