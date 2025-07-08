import { getImageUrl } from '@lib/utils'
import { generateImage } from '@lib/solo/server-aiml'
import { ai, storytellerInstructions, storytellerParams, getContext } from '@lib/solo/server-gemini'

async function addPost (thread, ownerType, ownerId, content) {
  const { error: postError } = await locals.supabase.from('posts').insert({ thread, owner: ownerId, owner_type: ownerType, content })
  if (postError) { throw new Error('Chyba při ukládání příspěvku: ' + postError.message) }
}

async function addImage (prompt, type, gameId, threadId) {
  console.log('GENERATE IMAGE: \n', prompt)
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
  const { data: imageData, error: imageError } = await locals.supabase.storage.from(imageParams.bucket).upload(`/${gameId}/${new Date().getTime()}.jpg`, data)
  if (imageError) { console.error('Error saving image:', imageError) }
  // Add post
  const imageUrl = getImageUrl(locals.supabase, imageData.path, imageParams.bucket)
  const { data: postData, error: postError } = await locals.supabase.from('posts').insert({ thread: threadId, content: `<img src='${imageUrl}' alt='${type} illustration' />` }).select().single()
  if (postError) { console.error('Error saving image post:', postError) }
  return postData
}

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
            const characterData = npc || { name: 'Vypravěč', slug: 'vypravec', id: soloConcept.storyteller }
            const chunk = { character: characterData }
            controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`))
            characterSent = true
          }
        }

        const extractAndStreamContent = () => {
          // Extract character slug first
          if (!characterSent) {
            const charMatch = accumulatedText.match(/"character"\s*:\s*\{[^}]*"slug"\s*:\s*"([^"]*)"/)
            sendCharacterData(charMatch ? charMatch[1] : 'vypravec') // Default to storyteller if no character found
          }

          // Extract and stream post content
          if (characterSent) {
            // Look for the post content - more flexible regex
            const postMatch = accumulatedText.match(/"post"\s*:\s*"([^"]*(?:\\.[^"]*)*)"?/)
            if (postMatch) {
              let postContent = postMatch[1]
              // Only send new content since last time
              if (postContent.length > lastSentPostLength) {
                const newContent = postContent.slice(lastSentPostLength)
                if (newContent.length > 0) {
                  // Clean up escaped characters for display
                  const cleanContent = newContent.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\')
                  const chunk = { post: cleanContent }
                  controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                  lastSentPostLength = postContent.length
                }
              }
            }
          }
        }

        try {
          // Process the response stream from Gemini
          for await (const chunk of response) {
            const text = chunk.text
            if (text) {
              accumulatedText += text
              extractAndStreamContent()
            }
          }

          // Try to parse the complete JSON at the end
          try {
            const finalData = JSON.parse(accumulatedText)
            serverSideData = finalData
            
            // Make sure character was sent
            if (!characterSent && finalData.character?.slug) { sendCharacterData(finalData.character.slug) }

            // Save the complete post to the database
            const ownerNpc = npcs.find(npc => npc.slug === serverSideData.character?.slug)
            const ownerId = ownerNpc ? ownerNpc.id : soloConcept.storyteller

            await addPost(soloGame.thread, 'npc', ownerId, serverSideData.post)
            if (serverSideData.image && serverSideData.image.prompt) {
              const imagePost = await addImage(serverSideData.image.prompt, serverSideData.image.type, soloGame.id)
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ image: imagePost })}\n\n`))
            }
          } catch (error) {
            console.error('Error parsing final JSON:', error)
          }
          isClosed = true
          controller.close()
        } catch (error) {
          if (error.name !== 'AbortError') { console.error('Error in Gemini stream:', error) }
          isClosed = true
          controller.close()
        }
      },
      cancel () {
        if (!isClosed && streamController) {
          streamController.close()
          isClosed = true
        }
      }
    })

    return new Response(vendorStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
  } catch (error) {
    console.error('Error generating solo post:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

