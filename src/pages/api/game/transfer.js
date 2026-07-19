export const POST = async ({ request, locals }) => {
  if (!locals.user?.id) {
    return new Response(JSON.stringify({ error: 'Pro převod hry se přihlas.' }), { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const gameId = Number.parseInt(body.gameId, 10)
  const playerName = body.playerName?.trim()

  if (!Number.isInteger(gameId) || !playerName) {
    return new Response(JSON.stringify({ error: 'Chybí identifikátor hry nebo jméno hráče.' }), { status: 400 })
  }

  const { data: game, error: gameError } = await locals.supabase
    .from('games')
    .select('id, owner')
    .eq('id', gameId)
    .maybeSingle()

  if (gameError) {
    return new Response(JSON.stringify({ error: gameError.message }), { status: 500 })
  }
  if (!game) {
    return new Response(JSON.stringify({ error: 'Hra nebyla nalezena.' }), { status: 404 })
  }
  if (game.owner !== locals.user.id) {
    return new Response(JSON.stringify({ error: 'Hru může převést jen její vlastník.' }), { status: 403 })
  }

  const { data: player, error: playerError } = await locals.supabase
    .from('profiles')
    .select('id, name')
    .eq('name', playerName)
    .maybeSingle()

  if (playerError) {
    return new Response(JSON.stringify({ error: playerError.message }), { status: 500 })
  }
  if (!player) {
    return new Response(JSON.stringify({ error: 'Hráč s tímto jménem nebyl nalezen.' }), { status: 404 })
  }
  if (player.id === locals.user.id) {
    return new Response(JSON.stringify({ error: 'Hru nelze převést na současného vlastníka.' }), { status: 400 })
  }

  const { data: membership, error: membershipError } = await locals.supabase
    .from('characters')
    .select('id')
    .eq('game', gameId)
    .eq('player', player.id)
    .eq('accepted', true)
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    return new Response(JSON.stringify({ error: membershipError.message }), { status: 500 })
  }
  if (!membership) {
    return new Response(JSON.stringify({ error: 'Hru lze převést jen na přijatého hráče této hry.' }), { status: 400 })
  }

  const { error: updateError } = await locals.supabase
    .from('games')
    .update({ owner: player.id })
    .eq('id', gameId)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ owner: player }), { status: 200 })
}
