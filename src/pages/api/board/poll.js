function buildPollSummary (rows = [], userId = null) {
  const counts = Object.create(null)
  const userVotes = []

  rows.forEach(row => {
    const option = row.option_id
    counts[option] = (counts[option] || 0) + 1
    if (userId && row.profile_id === userId) {
      userVotes.push(option)
    }
  })

  return { counts, total: rows.length, userVotes }
}

export const GET = async ({ url, locals }) => {
  try {
    const pollId = url.searchParams.get('pollId')
    if (!pollId) {
      return new Response(JSON.stringify({ error: 'Chybí identifikátor ankety' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await locals.supabase
      .from('board_poll_votes')
      .select('option_id, profile_id')
      .eq('poll_id', pollId)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify(buildPollSummary(data, locals.user?.id || null)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error loading poll votes', error)
    return new Response(JSON.stringify({ error: 'Nepodařilo se načíst anketu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const POST = async ({ request, locals }) => {
  try {
    if (!locals.user?.id) {
      return new Response(JSON.stringify({ error: 'Pro hlasování se přihlas.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json().catch(() => ({}))
    const pollId = body.pollId
    const optionId = body.optionId

    if (!pollId || !optionId) {
      return new Response(JSON.stringify({ error: 'Chybí identifikátor ankety nebo volby' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const profileId = locals.user.id

    // remove previous vote to keep only a single choice
    const { error: deleteError } = await locals.supabase
      .from('board_poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('profile_id', profileId)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { error: upsertError } = await locals.supabase
      .from('board_poll_votes')
      .upsert({ poll_id: pollId, option_id: optionId, profile_id: profileId }, { onConflict: 'poll_id,profile_id' })

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data, error: loadError } = await locals.supabase
      .from('board_poll_votes')
      .select('option_id, profile_id')
      .eq('poll_id', pollId)

    if (loadError) {
      return new Response(JSON.stringify({ error: loadError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(buildPollSummary(data, profileId)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error saving poll vote', error)
    return new Response(JSON.stringify({ error: 'Nepodařilo se uložit hlas' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
