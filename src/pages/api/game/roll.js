
const rollDice = (sides, count) => {
  const roll = (d) => Math.floor(Math.random() * d) + 1
  return Array.from({ length: count }, () => {
    return sides === 100 ? roll(10) * 10 : roll(sides)
  })
}

export const GET = async ({ request, url, redirect, locals }) => {
  const { thread, dice, owner } = Object.fromEntries(url.searchParams)

  if (thread && dice && owner) {
    // parse dice notation
    const diceObject = dice.split(',').reduce((acc, curr) => { const [count, type] = curr.split('d').map(Number); acc['d' + type] = count; return acc }, {})

    // roll random numbers
    const notationParts = []
    const rolledValues = []
    const readableResults = {}
    Object.entries(diceObject).forEach(([type, count]) => {
      if (count > 0) {
        const sides = parseInt(type.slice(1))
        const rolls = rollDice(sides, count)
        notationParts.push(`${count}${type}`)
        rolledValues.push(...rolls)
        readableResults[type] = rolls
      }
    })

    // prepare readable results
    let post = "<div class='diceRoll'><h3>Hod kostkami</h3>"
    Object.entries(readableResults).forEach(([type, rolls]) => { post += `<div class='row'><span class='type'>${rolls.length}${type}:</span><b>${rolls.join(' ')}</b> = ${rolls.reduce((a, b) => a + b, 0)}</div>` })
    post += '</div>'

    // save as a post to db
    const { error } = await locals.supabase.from('posts').insert({ thread, owner, owner_type: 'character', content: post, dice: true })
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }

    // return to the game
    const results = `${notationParts.join('+')}@${rolledValues.join(',')}`
    return new Response(JSON.stringify({ results }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Chybí id vlákna, postavy, nebo kostky' }), { status: 500 })
  }
}
