
export const GET = async ({ request, cookies, redirect, locals }) => {
  try {
    cookies.delete('sb-access-token')
    cookies.delete('sb-refresh-token')
    await locals.supabase.auth.signOut()
  } catch (error) {
    console.error(error.message)
  }
  return redirect('/?toastType=success&toastText=' + encodeURIComponent('Uživatel odhlášen'))
}
