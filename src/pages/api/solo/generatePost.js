import { generateImage } from '@lib/solo/server-replicate'
import { StreamingJSONParser } from '@lib/solo/streaming-json-parser'
import { getImageUrl, getStamp } from '@lib/utils'
import { getAI, getStorytellerParams } from '@lib/solo/server-gemini'
import { createSSEStream, getSSEHeaders } from '@lib/solo/server-utils'
import { storytellerInstructions, getContext } from '@lib/solo/solo'

const imageBuckets = { header: 'headers', scene: 'scenes', item: 'items', npc: 'npcs' }

export const POST = async ({ request, locals }) => {
  if (locals.user.solo_limit <= 0) {
    return new Response(JSON.stringify({ error: 'Denní limit počtu odpovědí od AI vypravěče byl vyčerpán. Pokračuj zítra.' }), { status: 403 })
  } else {
    const ai = getAI(locals.runtime.env)

    async function addPost (thread, ownerType, ownerId, postData, postHash) {
      if (!postData || !postData.post || !postData.post.trim()) {
        throw new Error('Cannot save empty post content')
      }
      const { error: postError } = await locals.supabase.from('posts').insert({ thread, owner: ownerId, owner_type: ownerType, content: postData.post, identifier: postHash, illustration: postData.illustration })
      if (postError) { throw new Error('Chyba při ukládání příspěvku: ' + postError.message) }

      // update solo_limit for the user
      const { error: limitError } = await locals.supabase.from('profiles').update({ solo_limit: locals.user.solo_limit - 1 }).eq('id', locals.user.id)
      if (limitError) { throw new Error('Chyba při aktualizaci limitu: ' + limitError.message) }
    }

    async function addImage (prompt, type, gameId, threadId) {
      const { data, error } = await generateImage(locals.runtime.env, prompt, type)
      if (error) { throw new Error('Image generation failed: ' + error.message) }
      // Save image to storage
      const { data: imageData, error: imageError } = await locals.supabase.storage.from(imageBuckets[type]).upload(`/${gameId}/${new Date().getTime()}.jpg`, data, { contentType: 'image/jpg', upsert: true, metadata: { prompt } })
      if (imageError) { throw new Error('Image upload failed: ' + imageError.message) }
      // For scene add as standalone post
      let postData = null
      if (type === 'scene') {
        const imageUrl = getImageUrl(locals.supabase, imageData.path, imageBuckets.scene)
        const { data: postDataSaved, error: postError } = await locals.supabase.from('posts').insert({ thread: threadId, content: `<img src='${imageUrl}' alt='scene illustration' title='${imageData.prompt}' />`, owner_type: 'npc', identifier: getStamp() }).select().single()
        if (postError) { throw new Error('Error saving image post: ' + postError.message) }
        postData = postDataSaved
      }
      return { postData, imageData }
    }

    try {
      const { soloId, postHash, characterName } = await request.json()
      if (!locals.user?.id) { return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) }

      const { data: gameData, error: gameError } = await locals.supabase.from('solo_games').select('*').eq('id', soloId).single()
      if (gameError) { return new Response(JSON.stringify({ error: gameError.message }), { status: 500 }) }
      if (!gameData || gameData.player !== locals.user.id) {
        return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 })
      }

      const { data: conceptData, error: conceptError } = await locals.supabase.from('solo_concepts').select('*').eq('id', gameData.concept_id).single()
      if (conceptError) { return new Response(JSON.stringify({ error: conceptError.message }), { status: 500 }) }
      const storytellerParams = getStorytellerParams(conceptData)

      const { data: npcs, error: npcsError } = await locals.supabase.from('npcs').select('*').or(`solo_game.eq.${gameData.id},solo_concept.eq.${gameData.concept_id}`)
      if (npcsError) { return new Response(JSON.stringify({ error: npcsError.message }), { status: 500 }) }
      storytellerParams.config.responseSchema.properties.character.properties.slug.enum = npcs.map(npc => npc.slug) // Update the enum with available NPC slugs

      const { data: posts, error: postsError } = await locals.supabase.from('posts').select('*').match({ thread: gameData.thread }).order('created_at', { ascending: true })
      if (postsError) { return new Response(JSON.stringify({ error: postsError.message }), { status: 500 }) }
      const lastPost = posts[posts.length - 1]
      posts.pop()

      // Prepare post history for the AI model
      const history = posts.map(post => ({ role: post.owner_type === 'user' ? 'user' : 'model', parts: [{ text: post.content }] }))
      // Add a system message to the history with current inventory and abilities for the model's context
      if (gameData.inventory && gameData.inventory.length > 0) {
        history.push({ role: 'model', parts: [{ text: `[System Information: The player's current inventory contains: ${gameData.inventory.join(', ')}]` }] })
      }
      if (conceptData.abilities && conceptData.abilities.length > 0) {
        history.push({ role: 'model', parts: [{ text: `[System Information: The player's abilities are: ${conceptData.abilities.join(', ')}]` }] })
      }
      storytellerParams.config.systemInstruction = `${storytellerInstructions}
        ${getContext(conceptData, null, characterName, gameData.inventory, conceptData.abilities)}
        <h2>Plán hry:</h2>
        ${conceptData.generated_plan}
      `
      const chat = ai.chats.create({ ...storytellerParams, history })
      const response = await chat.sendMessageStream({ message: lastPost.content })

      // Create async generator for streaming
      async function * generateStreamData () {
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
                  const characterData = npc || { name: 'Vypravěč', slug: 'vypravec', id: conceptData.storyteller }
                  yield { character: characterData }
                } else if (event.post) {
                  yield { post: event.post }
                }
              }
            }
          }

          // Finalize parsing
          finalData = parser.finalize()
          // console.log('Final data received:', finalData)

          // Validate that we have the required data
          if (!finalData || typeof finalData !== 'object') {
            yield { error: 'Invalid response format from AI. Please try again.' }
            return
          }

          // Generate image if needed
          // console.log('Image data:', finalData.image)
          if (finalData.image && finalData.image.prompt) {
            const { imageData, postData } = await addImage(finalData.image.prompt, finalData.image.type, gameData.id, gameData.thread)
            if (finalData.image.type === 'scene') {
              yield { image: postData }
            } else {
              finalData.illustration = getImageUrl(locals.supabase, imageData.path, imageBuckets[finalData.image.type])
              yield { illustration: finalData.illustration, prompt: finalData.image.prompt }
            }
          }

          // console.log('Inventory data:', finalData.inventory)
          if (finalData.inventory && Array.isArray(finalData.inventory.items)) {
            await locals.supabase.from('solo_games').update({ inventory: finalData.inventory.items }).eq('id', gameData.id)
            yield { inventory: finalData.inventory }
          }

          // Check if the game ended
          if (finalData.end) {
            await locals.supabase.from('solo_games').update({ ended: true }).eq('id', gameData.id)
            yield { end: true }
          }

          // Save the complete post to the database
          const ownerNpc = npcs.find(npc => npc.slug === finalData.character?.slug)
          const ownerId = ownerNpc ? ownerNpc.id : conceptData.storyteller

          // Only save post if we actually have content
          if (finalData.post && finalData.post.trim()) {
            await addPost(gameData.thread, 'npc', ownerId, finalData, postHash)
          } else {
            // No post content generated, send error
            yield { error: 'No response was generated. Please try again.' }
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
}
