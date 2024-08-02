export const GET = async ({ request, url, redirect, locals }) => {
  const referer = request.headers.get('referer')
  const { workId, authorId } = Object.fromEntries(url.searchParams)

  const curatorIds = ['a78d91c6-3af6-4163-befd-e7b5d21d9c0f', 'c3304e31-9687-413f-a478-214c865bf5a2', '2d7898ea-ac7b-4f1b-bf29-a10c28892835', '6d3c87ea-aacc-4fd6-9859-852894fd3092'] // Sargo, Hitomi, Eskel, Eskel localhost

  if (curatorIds.includes(locals.user.id)) {
    // approve work
    const { error: approveError } = await locals.supabase.from('works').update({ published: true, created_at: (new Date()).toISOString() }).eq('id', workId)
    if (approveError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Schválení selhalo: ' + approveError.message)) }

    const { error: messageError } = await locals.supabase.from('messages').insert({
      content: 'Tvé dílo bylo právě zveřejněno. Díky za něj a přejeme mnoho laskavých komentářů.',
      sender_user: locals.user.id,
      recipient_user: authorId
    })
    if (messageError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Poslání zprávy autorovi selhalo: ' + messageError.message)) }

    return redirect(referer + '?toastType=success&toastText=' + encodeURIComponent('Dílo bylo schváleno'))
  } else {
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Nemáš právo schvalovat'))
  }
}
