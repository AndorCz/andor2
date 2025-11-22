import { formPost } from '@lib/common/context'
import { getAI, getReadableStream } from '@lib/solo/server-moonshot'
import { getPostGenerationInstructions } from '@lib/ai'

export const POST = async ({ locals, request }) => {
  const data = await request.json()
  const ai = getAI(locals.runtime.env)

  // Form context (instructions, codex)
  const instructions = await getPostGenerationInstructions(locals.supabase, data)

  // Load all posts
  const gameQuery = { thread_id: data.game.game_thread, game_id: data.game.id, _limit: 500, _offset: 0, _search: null, owners: null }
  const { data: postsData, error } = await locals.supabase.rpc('get_game_posts', gameQuery)
  if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
  const posts = postsData.posts || []

  const messages = [
    { role: 'system', content: instructions },
    ...posts.map(post => { return { role: 'system', content: formPost(post) } }),
    {
      role: 'user',
      content: `${data.audienceNames ? `Příspěvek je soukromý, jen pro: ${data.audienceNames}` : ''}
      --- PROMPT ${data.role === 'storyteller' ? 'VYPRAVĚČE' : 'HRÁČE'} ---\n
      ${data.prompt}`
    }
  ]

  console.log('messages', messages)

  const completion = await ai.chat.completions.create({ model: 'kimi-k2-0905-preview', messages, stream: true }, { signal: request.signal })

  const stream = await getReadableStream(completion)

  // Return stream response
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
  })
}
