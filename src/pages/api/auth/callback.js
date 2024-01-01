
import { saveAuthCookies } from '@lib/utils'
import { supabase } from '@lib/database'

export const GET = async ({ request, url, cookies, redirect, locals }) => {
  const authCode = url.searchParams.get('code')
  if (!authCode) { return new Response('No code provided', { status: 400 }) }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
  if (error) { return new Response(error.message, { status: 500 }) }
  // console.log('callback session data', data)

  saveAuthCookies(cookies, data.session)
  return redirect('/')
}
