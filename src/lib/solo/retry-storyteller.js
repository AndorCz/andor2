/** Retry an invalid response as a complete JSON object before publishing any replacement. */
export async function retryStoryteller (ai, params) {
  const response = await ai.chat.completions.create({
    ...params,
    stream: false,
    messages: [...params.messages, { role: 'user', content: 'Předchozí pokus nevrátil platný JSON. Vygeneruj celý příspěvek znovu jako jeden dokončený JSON objekt podle zadání. Buď stručný, uzavři všechny řetězce a objekty. Nevypisuj komentáře ani markdown.' }]
  })
  const choice = response.choices?.[0]
  if (choice?.finish_reason === 'content_filter') { throw new Error('Odpověď AI byla zablokována bezpečnostním filtrem.') }
  let data
  try {
    data = JSON.parse(choice?.message?.content || '')
  } catch {
    console.warn('Invalid storyteller retry', { finishReason: choice?.finish_reason, contentLength: choice?.message?.content?.length || 0, usage: response.usage })
    throw new Error('AI ani při opakovaném pokusu nevrátila úplnou JSON odpověď. Zkus to prosím znovu.')
  }
  if (typeof data?.post !== 'string' || !data.post.trim() || typeof data?.character?.slug !== 'string' || typeof data?.nsfw !== 'boolean') {
    throw new Error('AI při opakovaném pokusu vrátila neplatná data příspěvku.')
  }
  return data
}
