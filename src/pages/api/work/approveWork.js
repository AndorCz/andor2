export const GET = async ({ request, url, redirect, locals }) => {
  const referer = request.headers.get('referer')
  const { workId, authorId } = Object.fromEntries(url.searchParams)

  const curatorId = 'a78d91c6-3af6-4163-befd-e7b5d21d9c0f' // Sargo

  if (locals.user.id === curatorId) {
    // approve work
    const { error: approveError } = await locals.supabase.from('works').update({ published: true }).eq('id', workId)
    if (approveError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Schválení selhalo: ' + approveError.message)) }

    const { error: messageError } = await locals.supabase.from('messages').insert({
      content: 'Tvé dílo bylo právě zveřejněno. Díky a přejeme mnoho laskavých komentářů.',
      sender_user: curatorId,
      recipient_user: authorId
    })
    if (messageError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Poslání zprávy autorovi selhalo: ' + messageError.message)) }

    return redirect(referer + '?toastType=success&toastText=' + encodeURIComponent('Dílo bylo schváleno'))
  } else {
    return redirect(referer + '?toastType=error&toastText=' + encodeURIComponent('Nemáš právo schvalovat'))
  }
}
