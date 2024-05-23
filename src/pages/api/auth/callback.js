import { getSupabase, saveAuthCookies } from '@lib/database-server'

export const GET = async ({ request, cookies, redirect, context }) => {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'
    if (code) {
      const env = import.meta.env ? import.meta.env : context.locals.runtime.env
      const supabase = getSupabase(cookies, env)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      saveAuthCookies(cookies, data.session)
      if (error) { return redirect(`/?toastType=error&toastText=${encodeURIComponent('Chyba: ' + error.message)}`) }
      return redirect(next)
    }
  } catch (unhandledError) {
    return redirect(`/?toastType=error&toastText=${encodeURIComponent('Chyba: ' + unhandledError.message)}`)
  }
  return new Response('Přihlášení se nezdařilo. Zkus to prosím znovu.', { status: 500 })
}
