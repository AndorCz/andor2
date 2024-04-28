
export const POST = async ({ request, locals }) => {
  try {
    const { action, gameId, workId } = await request.json()
    switch (action) {
      case 'migrate_game':
      {
        return new Response(JSON.stringify({ gameId }), { status: 200 })
      }
      case 'migrate_work':
      {
        // Check if work belong to user
        const { data: workData, error: workError } = await locals.supabase
          .from('old_works')
          .select('*')
          .eq('id', workId)
          .eq('owner', locals.user.old_id)
          .eq('migrated', false)
          .maybeSingle()

        console.log(workError)
        if (workError) { return new Response(JSON.stringify({ error: workError.message }), { status: 500 }) }
        if (!workData) { return new Response(JSON.stringify({ error: 'Článek nenalezen - nesprávný uživatel nebo už byl zmigrován.' }), { status: 404 }) }

        const { data, error } = await locals.supabase.from('works').insert({
          owner: locals.user.id,
          name: workData.name,
          category: workData.category,
          content: workData.content,
          annotation: workData.annotation,
          tags: workData.tags,
          created_at: workData.post_date
        }).select().single()

        if (error || !data) {
          console.error('Error:', error.message)
          return new Response(JSON.stringify({ error: 'Error with db' }), { status: 500 })
        }
        // Update old_works so we know what was migrated
        // eslint-disable-next-line no-unused-vars
        const { data: updateData, error: updateError } = await locals.supabase
          .from('old_works')
          .update({ migrated: true })
          .eq('id', workId)
        return new Response(JSON.stringify({ status: 200 }))
      }
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}
