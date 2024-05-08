
export const GET = async ({ request, cookies, redirect, locals }) => {
  const referer = request.headers.get('referer')
  try {
    cookies.delete('sb-access-token')
    cookies.delete('sb-refresh-token')
    const { error: signOutError } = await locals.supabase.auth.signOut()
    if (signOutError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(signOutError.message)) }
    const { error: deleteError } = await locals.supabase.rpc('delete_user')
    if (deleteError) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(deleteError.message)) }
  } catch (error) {
    console.error(error.message)
  }
  return redirect('/?toastType=success&toastText=' + encodeURIComponent('Účet byl úspěšně smazán'))
}
