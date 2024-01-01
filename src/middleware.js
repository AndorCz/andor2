
import { supabase } from '@lib/database'
import { saveAuthCookies } from '@lib/utils'

export async function onRequest ({ request, cookies, locals, redirect, url }, next) {
  locals.user = {} // empty default

  // get auth cookies
  const accessToken = cookies.get('sb-access-token')?.value
  const refreshToken = cookies.get('sb-refresh-token')?.value

  if (accessToken && refreshToken) {
    const { data: authData, error } = await supabase.auth.setSession({ refresh_token: refreshToken, access_token: accessToken })

    if (error) {
      console.log('auth error', error.message) // log to not trigger sentry
      // not possible to use tokens, clean up cookies
      cookies.delete('sb-access-token')
      cookies.delete('sb-refresh-token')
    }
    if (authData.user) {
      saveAuthCookies(cookies, authData.session)
      locals.user = { id: authData.user.id, email: authData.user.email }
    }
    //  }
    // user exists, load profile data
    if (locals.user?.id) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', locals.user.id).maybeSingle()
      if (profileData?.name) {
        locals.user = { ...profileData, ...locals.user }
      } else if (url.pathname !== '/onboarding') {
        // go finish profile first
        return redirect('/onboarding')
      }
    }
  }
  return next()
}
