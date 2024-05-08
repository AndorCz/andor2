
export const GET = async ({ request, cookies, redirect, locals }) => {
  const referer = request.headers.get('referer')
  try {
    cookies.delete('sb-access-token')
    cookies.delete('sb-refresh-token')
    const { error } = await locals.supabase.auth.signOut()
    if (error) { redirect(referer + '?toastType=error&toastText=' + encodeURIComponent(error.message)) }
  } catch (error) {
    console.error(error.message)
  }
  return redirect('/?toastType=success&toastText=' + encodeURIComponent('Uživatel odhlášen'))
}
