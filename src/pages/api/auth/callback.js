import { saveAuthCookies } from '@lib/database-server'

export const GET = async ({ locals, request, cookies, redirect }) => {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'
    if (!code) return new Response('No code provided', { status: 400 })

    const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code)
    if (error) return redirect(`/?toastType=error&toastText=${encodeURIComponent('Chyba: ' + error.message)}`)

    saveAuthCookies(cookies, data.session)
    return redirect(next)
  } catch (unhandledError) {
    return redirect(`/?toastType=error&toastText=${encodeURIComponent('Chyba: ' + unhandledError.message)}`)
  }
}
