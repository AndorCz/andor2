
import { supabase } from '@lib/database'

const rollDice = (sides, count) => Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)

export const GET = async ({ url, redirect, locals }) => {
  const { thread, dice, owner } = Object.fromEntries(url.searchParams)

  if (thread && dice && owner) {
    // parse dice notation
    const diceObject = dice.split(',').reduce((acc, curr) => { const [count, type] = curr.split('d').map(Number); acc['d' + type] = count; return acc }, {})

    // roll random numbers
    const notationParts = []
    const rolledValues = []
    Object.entries(diceObject).forEach(([type, count]) => {
      if (count > 0) {
        const sides = parseInt(type.slice(1))
        const rolls = rollDice(sides, count)
        notationParts.push(`${count}${type}`)
        rolledValues.push(...rolls)
      }
    })

    // prepare readable results
    const readableResults = {}
    let post = "<div class='diceRoll'><h3>Hod kostkami</h3>"
    Object.entries(diceObject).forEach(([type, count]) => {
      if (count > 0) {
        const sides = parseInt(type.slice(1))
        readableResults[type] = rollDice(sides, count)
      }
    })
    Object.entries(readableResults).forEach(([type, rolls]) => { post += `${type}: <b>${rolls.join(', ')}</b><br>` })
    post += '</div>'

    // save as a post to db
    const { error } = await supabase.from('posts').insert({ thread, owner, owner_type: 'character', content: post })
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }

    // return to the game
    const results = `${notationParts.join('+')}@${rolledValues.join(',')}`
    return new Response(JSON.stringify({ results }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Chybí id vlákna, postavy, nebo kostky' }), { status: 500 })
  }
}
