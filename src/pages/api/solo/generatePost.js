import { getImageUrl } from '@lib/utils'
import { generateImage } from '@lib/solo/server-aiml'
import { StreamingJSONParser } from '@lib/solo/streaming-json-parser'
import { createSSEStream, getSSEHeaders } from '@lib/solo/server-utils'
import { ai, storytellerInstructions, storytellerParams, getContext } from '@lib/solo/server-gemini'

export const POST = async ({ request, locals }) => {

  async function addPost (thread, ownerType, ownerId, content) {
    const { error: postError } = await locals.supabase.from('posts').insert({ thread, owner: ownerId, owner_type: ownerType, content })
    if (postError) { throw new Error('Chyba při ukládání příspěvku: ' + postError.message) }
  }

  async function addImage (prompt, type, gameId, threadId) {
    const getImageParams = (type) => {
      switch (type) {
        case 'scene': return { width: 1408, height: 768, bucket: 'scenes' }
        case 'item': return { width: 140, height: 352, bucket: 'items' }
        case 'npc': return { width: 140, height: 352, bucket: 'npcs' }
        default: throw new Error('Neznámý typ obrázku')
      }
    }
    const imageParams = getImageParams(type)
    const { data, error } = await generateImage(prompt, imageParams.width, imageParams.height)
    if (error) { console.error('Error generating image:', error) }
    // Save image to storage
    const { data: imageData, error: imageError } = await locals.supabase.storage.from(imageParams.bucket).upload(`/${gameId}/${new Date().getTime()}.jpg`, data, { contentType: 'image/jpg' })
    if (imageError) { console.error('Error saving image:', imageError) }
    // Add post
    const imageUrl = getImageUrl(locals.supabase, imageData.path, imageParams.bucket)
    const { data: postData, error: postError } = await locals.supabase.from('posts').insert({ thread: threadId, content: `<img src='${imageUrl}' alt='${type} illustration' />`, owner_type: 'npc' }).select().single()
    if (postError) { console.error('Error saving image post:', postError) }
    return postData
  }

  try {
    const { soloId } = await request.json()
    if (!locals.user?.id) { return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) }

    const { data: soloGame, error: gameError } = await locals.supabase.from('solo_games').select('*').eq('id', soloId).single()
    if (gameError) { return new Response(JSON.stringify({ error: gameError.message }), { status: 500 }) }
    if (!soloGame || soloGame.player !== locals.user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 })
    }

    const { data: soloConcept, error: conceptError } = await locals.supabase.from('solo_concepts').select('*').eq('id', soloGame.concept_id).single()
    if (conceptError) { return new Response(JSON.stringify({ error: conceptError.message }), { status: 500 }) }

    const { data: npcs, error: npcsError } = await locals.supabase.from('npcs').select('*').or(`solo_game.eq.${soloGame.id},solo_concept.eq.${soloGame.concept_id}`)
    if (npcsError) { return new Response(JSON.stringify({ error: npcsError.message }), { status: 500 }) }
    storytellerParams.config.responseSchema.properties.character.properties.slug.enum = npcs.map(npc => npc.slug) // Update the enum with available NPC slugs

    const { data: posts, error: postsError } = await locals.supabase.from('posts').select('*').match({ thread: soloGame.thread }).order('created_at', { ascending: true })
    if (postsError) { return new Response(JSON.stringify({ error: postsError.message }), { status: 500 }) }
    const lastPost = posts[posts.length - 1]
    posts.pop()

    const history = posts.map(post => ({ role: post.owner_type === 'user' ? 'user' : 'model', parts: [{ text: post.content }] }))
    const context = getContext(soloConcept) + '\n\n<h2>Plán hry</h2>' + soloConcept.generated_plan
    const chat = ai.chats.create({ ...storytellerParams, systemInstruction: storytellerInstructions + '\n\n' + context, history })
    const response = await chat.sendMessageStream({ message: lastPost.content })

    // Create async generator for streaming
    async function* generateStreamData() {
      let finalData = null
      const parser = new StreamingJSONParser()

      try {
        // Process the Gemini stream
        for await (const chunk of response) {
          if (chunk.text) {
            const events = parser.processChunk(chunk.text)
            
            for (const event of events) {
              if (event.character) {
                // Enhance character data with full NPC info
                const npc = npcs.find(npc => npc.slug === event.character.slug)
                const characterData = npc || { name: 'Vypravěč', slug: 'vypravec', id: soloConcept.storyteller }
                yield { character: characterData }
              } else if (event.post) {
                yield { post: event.post }
              }
            }
          }
        }

        // Finalize parsing
        finalData = parser.finalize()
        console.log('Final data received:', finalData)

        // Save the complete post to the database
        const ownerNpc = npcs.find(npc => npc.slug === finalData.character?.slug)
        const ownerId = ownerNpc ? ownerNpc.id : soloConcept.storyteller

        await addPost(soloGame.thread, 'npc', ownerId, finalData.post)
        
        // Generate image if needed
        if (finalData.image && finalData.image.prompt) {
          const imagePost = await addImage(finalData.image.prompt, finalData.image.type, soloGame.id, soloGame.thread)
          yield { image: imagePost }
        }

        if (finalData.inventory && Array.isArray(finalData.inventory.items)) {
          await locals.supabase.from('solo_game').update({ inventory: finalData.inventory.items }).eq('id', soloGame.id)
          yield { inventory: finalData.inventory.items, change: finalData.inventory.change || '' }
        }

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error in Gemini stream:', error)
        }
        throw error
      }
    }

    const stream = createSSEStream(generateStreamData())
    return new Response(stream, { headers: getSSEHeaders() })
  } catch (error) {
    console.error('Error generating solo post:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
