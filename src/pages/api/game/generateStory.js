import { getOpenAI, createAssistant, createThread, processRun, savePost } from '@lib/openai'

export const maxDuration = 600 // 10 minutes

async function cleanup (openai, threadId, assistantId) {
  await openai.beta.threads.del(threadId)
  await openai.beta.assistants.del(assistantId)
}

export const GET = async ({ request, url, locals, context }) => {
  const env = import.meta.env ? import.meta.env : context.locals.runtime.env
  const openai = getOpenAI(env)
  const { name, annotation, prompt, system, gameId } = Object.fromEntries(url.searchParams)

  async function save (responses) {
    const story = responses.join('\n\n')
    const { error } = await locals.supabase.from('games').update({ story }).eq('id', gameId)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }
  }

  function sendEvent (controller, encoder, data, responses) {
    controller.enqueue(encoder.encode(`data: ${encodeURIComponent(data)}\n\n`))
    responses.push(data)
    save(responses)
  }

  // check if user is a storyteller for the game
  const { data: storytellerData, error: storytellerError } = await locals.supabase.rpc('is_storyteller', { game_id: gameId }).single()
  if (storytellerError) { return new Response(JSON.stringify({ error: storytellerError.message }), { status: 500 }) }
  if (storytellerData) {
    // generate the story
    const readable = new ReadableStream({
      async start (controller) {
        // console.log('STARTING TO GENERATE')

        request.signal.addEventListener('abort', async () => { // not working, not sure why
          await cleanup(openai, threadId, assistantId)
          controller.close()
        })

        let data, res
        const responses = []
        const encoder = new TextEncoder()
        const assistantId = await createAssistant(openai, 'Temporary Assistant', decodeURIComponent(system))
        const threadId = await createThread(openai)

        // write the basic setting
        if (prompt) {
          await savePost(openai, threadId, `Hrajeme stolní RPG hru jménem: ${decodeURIComponent(name)}
            Základní popis hry pro hráče:
            ${decodeURIComponent(annotation)}
            ---
            Toto je zadání od vypravěče pro přípravu podkladů:
            ${decodeURIComponent(prompt)}
            ---
            Text prosím formátuj pomocí HTML značek.`
          )
          data = await processRun(openai, threadId, assistantId, true)
          if (data) { sendEvent(controller, encoder, data, responses, locals) } else { return 'Failed to generate the story (setting)' }
        } else {
          await savePost(openai, threadId, `Hrajeme stolní RPG hru jménem: ${decodeURIComponent(name)}
            Základní popis hry pro hráče:
            ${decodeURIComponent(annotation)}
            ---
            Text prosím formátuj pomocí HTML značek.
            ---
            Nyní popiš první kategorii podkladů:
            1. Místo: Kde se hra odehrává? Kdy? Vypiš na jeden řádek stručně tyto dvě faktické informace. Na další řádek přidej jednu větu kterou shrneš (či vymyslíš) aktuální setting a druhou větu o čem v kampani půjde.`
          )
          data = await processRun(openai, threadId, assistantId, true)
          if (data) { sendEvent(controller, encoder, data, responses, locals) } else { return 'Failed to generate the story (setting)' }

          // write factions
          res = await openai.beta.threads.messages.create(threadId, { role: 'user', content: '2. Frakce: Popiš jaké frakce operují v dané lokaci a jaký je mezi nimi vztah. Kdo kontroluje jaké území, jaké mají cíle, plány a problémy.' })
          if (res.error) { return console.error(res.error) }
          data = await processRun(openai, threadId, assistantId, true)
          if (data) { sendEvent(controller, encoder, data, responses, locals) } else { return 'Failed to generate the story (factions)' }

          // write characters
          res = await openai.beta.threads.messages.create(threadId, { role: 'user', content: '3. Postavy: Popiš stručně 10 nejdůležitějších (nehráčských) postav příběhu. Začni nejvlivnějšími postavami a postupně pokračuj i na ty se kterými se hráči dostanou snáze do kontaktu. Na všech by měly být kladné i záporné vlastnosti. O každé postavě napiš stručně následující: Jak postava vypadá, jaké je národnosti, etnika, kultury, jak se odívá. K jaké frakci náleží, jaký má charakter, společenskou úlohu, stáří, vliv. Jak se jmenuje a kdo má pro ní případně jaké přezdívky. Zvol zajímavé (ale uvěřitelné) jméno, dobře zapamatovatelná, dobře sedící k charakteru a kultuře postavy. Její stručnou historii. Jaké má cíle a problémy. Jaké jsou její nejdůležitější vztahy.' })
          if (res.error) { return console.error(res.error) }
          data = await processRun(openai, threadId, assistantId, true)
          if (data) { sendEvent(controller, encoder, data, responses, locals) } else { return 'Failed to generate the story (characters)' }

          // write locations
          res = await openai.beta.threads.messages.create(threadId, { role: 'user', content: '4. Lokace: Popiš stručně 10 nejdůležitějších lokací příběhu. Základny frakcí, důležitá veřejná místa, útočiště, domovy, podniky, shromaždiště, apod. O každé lokaci napiš stručně následující: Oficiální název a případné alternativní názvy. Jak lokace vypadá, v jakém je stavu a kdo v ní bývá k nalezení (běžní občané, postavy, zvířata etc.). Kdo má případně lokaci pod kontrolou - frakce, postava.' })
          if (res.error) { return console.error(res.error) }
          data = await processRun(openai, threadId, assistantId, true)
          if (data) { sendEvent(controller, encoder, data, responses, locals) } else { return 'Failed to generate the story (locations)' }

          // write plot
          res = await openai.beta.threads.messages.create(threadId, { role: 'user', content: '5. Příběh: Navrhni tři body příběhu kterých se může vypravěč chytit. Úvod: Kde příběh začne, co dostane hráčské postavy dohromady a donutí je spolupracovat. Nastol ústřední konflikt, úkol, záhadu - ideálně vše zmíněné. Střed: K čemu se musí hráči dopracovat? Jaké obtíže budou muset překonat? Jaké nové problémy se objeví? Jaké nové prostředky budou moci získat? Jak vede problém či záhada hlouběji než si dosud mysleli? Závěr: Jaké je rozuzlení záhady a uspokojivý cíl příběhu? K jakému bodu se musí ultimátně dostat pro zdárné zakončení kampaně? Buď konkrétní: Urči jaké postavy, předměty a lokace budou jakým způsobem důležité pro posun příběhu.' })
          if (res.error) { return console.error(res.error) }
          data = await processRun(openai, threadId, assistantId, true)
          if (data) { sendEvent(controller, encoder, data, responses, locals) } else { return 'Failed to generate the story (plot)' }
        }
        await cleanup(openai, threadId, assistantId)
        controller.enqueue(encoder.encode('event: success\ndata: {}\n\n'))
        controller.close()
        // console.log('FINISHED GENERATING')
      }
    })

    return new Response(readable, {
      // Set the headers for Server-Sent Events (SSE)
      headers: {
        Connection: 'keep-alive',
        'Content-Encoding': 'none',
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type': 'text/event-stream; charset=utf-8'
      }
    })
    // return new Response(JSON.stringify({ story }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Nejsi vypravěčem hry' }), { status: 500 })
  }
}
