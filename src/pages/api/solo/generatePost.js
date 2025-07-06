import { getImageUrl } from '@lib/utils'
import { generateImage } from '@lib/solo/server-aiml'
import { ai, storytellerInstructions, storytellerParams, getContext } from '@lib/solo/server-gemini'

export const POST = async ({ request, locals }) => {
  try {
    const { soloId } = await request.json()
    if (!locals.user?.id) { return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) }

    const { data: soloGame, error: gameError } = await locals.supabase.from('solo_games').select('*').eq('id', soloId).single()
    if (gameError) { return new Response(JSON.stringify({ error: gameError.message }), { status: 500 }) }
    if (!soloGame || soloGame.player !== locals.user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 })
    }

    // TODO: Save original concept data in the game instance, to prevent changes from affecting ongoing games
    const { data: soloConcept, error: conceptError } = await locals.supabase.from('solo_concepts').select('*').eq('id', soloGame.concept_id).single()
    if (conceptError) { return new Response(JSON.stringify({ error: conceptError.message }), { status: 500 }) }

    const { data: posts, error: postsError } = await locals.supabase.from('posts').select('*').match({ thread: soloGame.thread }).order('created_at', { ascending: true })
    if (postsError) { return new Response(JSON.stringify({ error: postsError.message }), { status: 500 }) }
    const lastPost = posts[posts.length - 1]
    posts.pop()

    const history = posts.map(post => ({ role: post.owner_type === 'user' ? 'user' : 'model', parts: [{ text: post.content }] }))
    const context = getContext(soloConcept) + '\n\n<h2>Plán hry</h2>' + soloConcept.generated_plan
    const config = { ...storytellerParams.config, systemInstruction: storytellerInstructions + '\n\n' + context }

    const chat = ai.chats.create({ model: 'gemini-2.5-pro', history, config })
    const response = await chat.sendMessageStream({ message: lastPost.content, config })

    let finalText = ''
    let streamController
    let isClosed = false
    const vendorStream = new ReadableStream({
      async start (controller) {
        streamController = controller
        const enc = new TextEncoder()
        let finishReason = null
        try {
          // Process the response stream
          for await (const chunk of response) {
            const text = chunk.text
            if (text) {
              finalText += text
              controller.enqueue(enc.encode(`data: ${text.replace(/\n/g, '[line-break]')}\n\n`))
            }
            if (chunk.candidates && chunk.candidates[0].finishReason) { finishReason = chunk.candidates[0].finishReason }
          }

          // Check for function calls in the response
          if (response.functionCalls && response.functionCalls.length > 0) {
            console.log('MODEL CALLED FUNCTIONS', response.functionCalls)
            const functionCall = response.functionCalls[0]
            const { type, prompt } = functionCall.args
            
            // Add image
            if (functionCall.name === 'AddImage' && type && prompt) {
              const getImageParams = (type) => {
                switch (type) {
                  case 'scene': return { width: 1408, height: 768, bucket: 'scenes' }
                  case 'item': return { width: 140, height: 352, bucket: 'items' }
                  case 'npc': return { width: 140, height: 352, bucket: 'npcs' }
                  default: throw new Error('Neznámý typ obrázku')
                }
              }
              const params = getImageParams(type)
              const { data: image, error: imageError } = await generateImage(prompt, params.width, params.height)
              if (imageError) { throw new Error('Chyba při generování obrázku: ' + imageError.message) }

              const { data: uploadData, error: uploadError } = await locals.supabase.storage.from(params.bucket).upload(`${soloGame.id}/${new Date().getTime()}.jpg`, image, { contentType: 'image/jpg' })
              if (uploadError) { throw new Error('Chyba při ukládání obrázku: ' + uploadError.message) }

              finalText += `<p><img src='${getImageUrl(uploadData.path)}' alt='${type} illustration' /></p>`
            }

            // TODO: "Add NPC" function
          }

          // Save the final post
          const { error: postError } = await locals.supabase.from('posts').insert({ thread: soloGame.thread, owner: soloConcept.storyteller, owner_type: 'npc', content: finalText, note: finishReason })
          if (postError) { throw new Error('Chyba při ukládání příspěvku: ' + postError.message) }
          isClosed = true
          controller.close()
        } catch (error) {
          isClosed = true
          if (error.name !== 'AbortError') { throw error }
        }
      },
      cancel () {
        if (!isClosed && streamController) {
          try {
            streamController.close()
            isClosed = true
          } catch (error) {
            console.warn('Controller already closed, ignoring:', error.message)
          }
        }
      }
    })

    const outStream = new ReadableStream({
      async start(outController) {
        const reader = vendorStream.getReader()
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            outController.enqueue(value)
          }
        } catch (error) {
          console.error('Stream reading error:', error)
        } finally {
          outController.close()
        }
      }
    })

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked'
    }
    return new Response(outStream, { headers })
  } catch (error) {
    console.error('Error generating solo post:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
