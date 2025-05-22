// import { savePost, editPost } from '@lib/openai'
import { isFilledArray } from '@lib/utils'

// get all posts

export const GET = async ({ url, redirect, locals }) => {
  try {
    const { thread, game, owners, limit = 100, offset = 0, search } = Object.fromEntries(url.searchParams)
    const filterOwners = owners && isFilledArray(JSON.parse(owners)) ? JSON.parse(owners) : null
    let res, posts, count
    if (game) { // handle game thread
      res = await locals.supabase.rpc('get_game_posts', { thread_id: thread, game_id: game, owners: filterOwners, _limit: limit, _offset: offset, _search: search })
      if (res.error) { return new Response(JSON.stringify({ error: res.error.message }), { status: 500 }) }
      posts = res.data.posts
      count = res.data.count
    } else { // handle other threads
      const query = locals.supabase.from('posts_owner').select('*', { count: 'exact' }).eq('thread', game).range(offset, offset + limit - 1)
      if (search) { query.ilike('content', `%${search}%`) } // search in posts
      if (filterOwners) { query.in('owner', filterOwners) } // add your posts
      query.order('created_at', { ascending: false })
      res = await query
      if (res.error) { return new Response(JSON.stringify({ error: res.error.message }), { status: 500 }) }
      posts = res.data
      count = res.count
    }
    return new Response(JSON.stringify({ posts, count }), { status: 200 })
  } catch (error) {
    return redirect(`/500?error=${encodeURIComponent(error.message)}`, 302)
  }
}

// add new post
export const POST = async ({ request, locals }) => {
  const data = await request.json()
  if (locals.user.id) { // check if user is signed in
    if (Array.isArray(data.audience) && data.audience.length === 0) { data.audience = null } // don't save empty array
    const postData = { thread: data.thread, owner: data.owner, owner_type: data.ownerType, content: data.content, audience: data.audience, post_type: 'other' }
    /*
    if (data.openAiThread) { // send to open ai thread
      // UNCOMMENT ONCE POST EDITING IS ALLOWED
      // const openAiPost = await savePost(data.openAiThread, data.content, data.character)
      // postData.openai_post = openAiPost.id
    }
    */
    // save to supabase
    const { error } = await locals.supabase.from('posts').insert(postData)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
    return new Response('{}', { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Přihlášení vypršelo, příspěvek bohužel nelze odeslat' }), { status: 500 })
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
      return new Response(JSON.stringify({ error: 'Přihlášení vypršelo, příspěvek bohužel nelze odeslat' }), { status: 500 })
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
    // editPost(openai, thread, data.openai_post, 'deleted')
  }
  if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
  return new Response('{}')
}
