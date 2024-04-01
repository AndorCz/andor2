
import { getSupabase } from '@lib/database'
import { saveAuthCookies } from '@lib/utils'

export async function onRequest ({ cookies, locals, redirect, url }, next) {
  const handleError = (error) => {
    console.error(error)
    return next()
  }

  locals.user = {} // empty default

  // get auth cookies
  const accessToken = cookies.get('sb-access-token')?.value
  const refreshToken = cookies.get('sb-refresh-token')?.value

  const supabase = getSupabase(cookies)

  if (accessToken && refreshToken) {
    locals.supabase = supabase
    const { data: authData, error } = await locals.supabase.auth.setSession({ refresh_token: refreshToken, access_token: accessToken })

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
    // user exists, load profile data
    if (locals.user?.id) {
      const { data: profileData } = await locals.supabase.from('profiles').select('*').eq('id', locals.user.id).maybeSingle()
      if (profileData?.name) {
        locals.user = { ...profileData, ...locals.user }
        const { error: profileError } = await locals.supabase.from('profiles').update({ last_activity: new Date() }).eq('id', locals.user.id)
        if (profileError) { return handleError(profileError) }
      } else if (url.pathname !== '/onboarding') {
        // go finish profile first
        return redirect('/onboarding')
      }
    }
  } else {
    cookies.delete('sb-access-token')
    cookies.delete('sb-refresh-token')
    locals.supabase = supabase
  }
  return next()
}
