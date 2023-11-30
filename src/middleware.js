import jwt from 'jsonwebtoken'
import { supabase } from '@lib/database'
import { saveAuthCookies } from '@lib/utils'

export async function onRequest ({ cookies, locals, redirect, url }, next) {
  // get auth cookies
  const accessToken = cookies.get('sb-access-token')?.value
  const refreshToken = cookies.get('sb-refresh-token')?.value

  if (accessToken && refreshToken) {
    let decoded
    try {
      // try reading user from jwt payload
      decoded = jwt.verify(accessToken, import.meta.env.SUPABASE_JWT_SECRET)
    } catch (e) { console.log('jwt verify error: ', e.message) }
    if (decoded) {
      locals.user = { id: decoded.sub, email: decoded.email }
    } else {
      // try refreshing session
      const { data: authData, error } = await supabase.auth.setSession({ refresh_token: refreshToken, access_token: accessToken })
      if (error) {
        // console.log('setSession error: ', error.message)
        // not possible to use tokens, clean up cookies
        cookies.delete('sb-access-token')
        cookies.delete('sb-refresh-token')
      }
      if (authData.user) {
        saveAuthCookies(authData.session)
        locals.user = { id: authData.user.id, email: authData.user.email }
      }
    }
    // user exists, load profile data
    if (locals.user) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', locals.user.id).maybeSingle()
      if (profileData?.username) {
        locals.user = { ...profileData, ...locals.user }
      } else if (url.pathname !== '/onboarding') {
        // go finish profile first
        return redirect('/onboarding')
      }
    }
  }
  // console.log('locals: ', locals)
  return next()
}
