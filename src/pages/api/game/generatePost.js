import { getAI } from '@lib/solo/server-moonshot'
import { gameSystems } from '@lib/constants'
import { gatherCodex } from '@lib/common/context'

export const POST = async ({ locals, request }) => {
  const formCharacterContext = (char) => {
    return `### ${char.name}
Popis: ${char.bio || 'Žádný popis'}
${data.isStoryteller && char.storyteller_notes ? `Poznámky vypravěče: ${char.storyteller_notes}` : ''}
`
  }

  const data = await request.json()
  const customFonts = [...data.game.fonts, 'Lucida Handwriting', 'Caveat', 'Orbitron']
  const ai = getAI(locals.runtime.env)
  let instructions

  const styleNotes = 'Používej jednoduché HTML značky pro stylování příspěvku. Používej uvozovky a tučné písmo pro zvýraznění přímé řeči. Používej kurzívu pro myšlenky postavy. Dodržuj tón a styl dle daného žánru hry. Příspěvek by neměl být příliš dlouhý, jeden až tři odstavce, podle potřeby děje.'

  if (data.isStoryteller) {
    // Storyteller
    instructions = `Jsi asistent vypravěče ve hře na hrdiny. Tvým úkolem je rozepsat vypravěčův vstupní text (prompt, označený jako "--- PROMPT VYPRAVĚČE ---") do plnohodnotného herního příspěvku.
## Styl výstupu
${styleNotes}
Pokud uvádíš novou scénu, můžeš použít nadpis a případně jeden z custom fontů dostupných ve hře (inline css font-family). Default je hezký font 'Alegreya', ideální pro fantasy a klasiku.

## Tajné poznámky vypravěče
${data.game.notes || 'Žádné poznámky'}
## Plán příběhu
${data.game.story || 'Žádný plán'}
`
  } else {
    // Player character - todo: Add portrait
    instructions = `Jsi asistent hráče ve hře na hrdiny. Tvým úkolem je rozepsat hráčův vstupní text (prompt, označený jako "--- PROMPT HRÁČE ---") do plnohodnotného herního příspěvku.
## Styl výstupu
${styleNotes}
## Popis tvé postavy
${formCharacterContext(data.character)}`
  }

  // Form context - todo: Add maps
  const context = `${instructions}
# Název hry: ${data.game.name}
Anotace: ${data.game.annotation || 'Žádná anotace'}
Tagy: ${data.game.category.join(', ')}
TTRPG systém: ${gameSystems.find(system => system.value === data.game.system)?.label || 'Bez systému'}
Dostupné custom fonty: ${customFonts.join(', ')}

## Popis hry
${gatherCodex(data.game.id)}

## Hráčské postavy ve hře
${data.game.characters.map(formCharacterContext).join('\n')}
`

  // Load all posts
  const res = await fetch(`/api/post?thread=${data.game.game_thread}&game=${data.game.id}&limit=500`, { method: 'GET' })
  const json = await res.json()
  if (res.error || json.error) { return new Response(JSON.stringify({ error: res.message }), { status: 500 }) }
  const posts = json.posts

  const messages = [
    { role: 'system', content: context },
    ...posts.map(post => { return { role: 'system', content: post.content } }),
    { role: 'user', content: `--- PROMPT ${data.isStoryteller ? 'VYPRAVĚČE' : 'HRÁČE'} ---\n` + data.prompt }
  ]

  console.log('messages', messages)

  const completion = await ai.chat.completions.create({ model: 'kimi-k2-thinking', messages, stream: true })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start (controller) {
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content
        if (content) { controller.enqueue(encoder.encode(content)) }
      }
      controller.close()
    }
  })

  // Return stream response
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
  })
}
