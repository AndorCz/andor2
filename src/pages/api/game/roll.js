const rollDice = (sides, count) => {
  return Array.from({ length: count }, () => { return Math.floor(Math.random() * sides) + 1 })
}

export const GET = async ({ request, url, redirect, locals }) => {
  let { thread, dice, owner, audience } = Object.fromEntries(url.searchParams)

  if (thread && dice && owner) {
    // parse dice notation
    const diceObject = dice.split(',').reduce((acc, curr) => { const [count, type] = curr.split('k').map(Number); acc['k' + type] = count; return acc }, {})

    // roll random numbers
    const typeResults = { k4: [], k6: [], k8: [], k10: [], k12: [], k20: [], k100: [] }
    const readableResults = {}
    Object.entries(diceObject).forEach(([type, count]) => {
      if (count > 0) {
        const sides = parseInt(type.slice(1))
        const rolls = rollDice(sides, count)
        if (sides === 100) {
          // add two dice (k10 and k100) for percentile dice
          rolls.forEach((roll, index) => { // split roll into two parts
            typeResults.k10.push(roll % 10)
            typeResults.k100.push(Math.floor(roll / 10) * 10)
          })
        } else {
          typeResults[type].push(...rolls)
        }
        readableResults[type] = rolls
      }
    })

    // prepare readable results
    let post = "<div class='diceRoll'>"
    Object.entries(readableResults)
      .filter(([type, rolls]) => rolls.length > 0) // Filter out empty keys
      .forEach(([type, rolls]) => { post += `<div class='row'><span class='type'>${rolls.length}${type}:</span><b>${rolls.join(' ')}</b> = ${rolls.reduce((a, b) => a + b, 0)}</div>` })
    post += '</div>'

    // save as a post to db
    audience = audience && audience.length ? JSON.parse(audience) : null
    const postData = { thread, owner, owner_type: 'character', content: post, dice: true, audience, post_type: 'game' }
    const { error } = await locals.supabase.from('posts').insert(postData)
    if (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }) }

    // return to the game
    const notation = Object.entries(typeResults)
      .filter(([type, rolls]) => rolls.length > 0) // filter out empty keys
      .map(([type, rolls]) => `${rolls.length}${type}`)
      .join('+') + '@' + Object.values(typeResults).flat().join(',')
    return new Response(JSON.stringify({ results: notation }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: 'Chybí id vlákna, postavy, nebo kostky' }), { status: 500 })
  }
}
