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

    const { data: soloConcept, error: conceptError } = await locals.supabase.from('solo_concepts').select('*').eq('id', soloGame.concept_id).single()
    if (conceptError) { return new Response(JSON.stringify({ error: conceptError.message }), { status: 500 }) }

    // load npcs
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

    let streamController
    let isClosed = false
    const vendorStream = new ReadableStream({
      async start (controller) {
        streamController = controller
        const enc = new TextEncoder()

        let serverSideData = {}
        let characterSent = false
        let accumulatedText = ''
        let lastSentPostLength = 0

        const sendCharacterData = (slug) => {
          if (!characterSent) {
            const npc = npcs.find(npc => npc.slug === slug)
            const characterData = npc || { name: 'Vypravěč', slug: 'vypravec' }
            const chunk = { character: characterData }
            controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`))
            characterSent = true
          }
        }

        const extractAndStreamContent = () => {
          // Extract character slug first
          if (!characterSent) {
            const charMatch = accumulatedText.match(/"character"\s*:\s*\{[^}]*"slug"\s*:\s*"([^"]*)"/)
            if (charMatch) {
              console.log('Character found:', charMatch[1])
              sendCharacterData(charMatch[1])
            }
          }

          // Extract and stream post content
          if (characterSent) {
            // Look for the post content - more flexible regex
            const postMatch = accumulatedText.match(/"post"\s*:\s*"([^"]*(?:\\.[^"]*)*)"?/)
            if (postMatch) {
              let postContent = postMatch[1]
              console.log('Post content found, length:', postContent.length, 'last sent:', lastSentPostLength)
              
              // Only send new content since last time
              if (postContent.length > lastSentPostLength) {
                const newContent = postContent.slice(lastSentPostLength)
                if (newContent.length > 0) {
                  console.log('Sending new content:', newContent.substring(0, 50) + '...')
                  // Clean up escaped characters for display
                  const cleanContent = newContent
                    .replace(/\\"/g, '"')
                    .replace(/\\n/g, '\n')
                    .replace(/\\t/g, '\t')
                    .replace(/\\\\/g, '\\')
                  
                  const chunk = { post: cleanContent }
                  controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                  lastSentPostLength = postContent.length
                }
              }
            } else {
              // Debug: check what we have so far
              if (accumulatedText.includes('"post"')) {
                console.log('Post key found but content not matched. Accumulated text:', accumulatedText.substring(0, 200) + '...')
              }
            }
          }
        }

        try {
          // Process the response stream from Gemini
          for await (const chunk of response) {
            const text = chunk.text
            if (text) { 
              console.log('Received chunk:', text.substring(0, 50) + '...')
              accumulatedText += text
              console.log('Accumulated text length:', accumulatedText.length)
              extractAndStreamContent()
            }
          }

          console.log('Stream finished. Final accumulated text:', accumulatedText)

          // Try to parse the complete JSON at the end
          try {
            const finalData = JSON.parse(accumulatedText)
            serverSideData = finalData
            
            // Make sure character was sent
            if (!characterSent && finalData.character?.slug) {
              sendCharacterData(finalData.character.slug)
            }

            console.log('Full response received:', serverSideData)

            // Save the complete post to the database
            const ownerNpc = npcs.find(npc => npc.slug === serverSideData.character?.slug)
            const ownerId = ownerNpc ? ownerNpc.id : soloConcept.storyteller
            
            const { error: postError } = await locals.supabase.from('posts').insert({
              thread: soloGame.thread,
              owner: ownerId,
              owner_type: 'npc',
              content: serverSideData.post,
              note: serverSideData.scene
            })
            if (postError) { throw new Error('Chyba při ukládání příspěvku: ' + postError.message) }

            // Generate an image if the prompt exists
            if (serverSideData.image && serverSideData.image.prompt) {
              console.log('GENERATE IMAGE: \n', serverSideData.image.prompt)
              // generateImage(serverSideData.image.prompt, 768, 768, soloGame.thread, serverSideData.image.type)
              //   .catch(err => console.error('Failed to generate image in background:', err))
            }

          } catch (error) {
            console.error('Error parsing final JSON:', error)
            console.log('Accumulated text:', accumulatedText)
          }

          isClosed = true
          controller.close()
        } catch (error) {
          isClosed = true
          if (error.name !== 'AbortError') {
            console.error('Error in Gemini stream:', error)
          }
          controller.close()
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

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
    return new Response(vendorStream, { headers })
  } catch (error) {
    console.error('Error generating solo post:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

