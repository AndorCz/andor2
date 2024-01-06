
import { getSupabase } from '@lib/database'
import { saveAuthCookies } from '@lib/utils'

export const GET = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabase = getSupabase(cookies)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    saveAuthCookies(cookies, data.session)
    if (!error) { return redirect(next) }
  }

  return new Response('Přihlášení se nezdařilo. Zkus to prosím znovu.', { status: 500 })
}
