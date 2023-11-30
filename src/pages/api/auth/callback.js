
import { supabase } from '@lib/database'
import { saveAuthCookies } from '@lib/utils'

export const GET = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get('code')
  if (!authCode) { return new Response('No code provided', { status: 400 }) }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
  if (error) { return new Response(error.message, { status: 500 }) }
  // console.log('callback session data', data)

  saveAuthCookies(data.session)
  return redirect('/')
}
