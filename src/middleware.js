import { createServerClient, parseCookieHeader } from '@supabase/ssr'

export async function onRequest ({ request, cookies, locals, redirect, url, context }, next) {
  try {
    if (url.pathname !== '/outage') {
      locals.user = {} // default empty user object

      const env = import.meta.env || context.locals.runtime.env
      if (!env.PUBLIC_SUPABASE_URL) throw new Error('Missing environment variables')

      const supabase = createServerClient(
        env.PUBLIC_SUPABASE_URL,
        env.PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll () { return parseCookieHeader(request.headers.get('Cookie') ?? '') },
            setAll (cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => cookies.set(name, value, options))
            }
          }
        }
      )
      locals.supabase = supabase

      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) { console.error('Auth error, getting user: ', sessionError.message) }
      let sessionData = data.session || {}

      // Try to restore the user's session from cookies
      if (!sessionData.user) {
        const accessToken = cookies.get('sb-access-token')?.value
        const refreshToken = cookies.get('sb-refresh-token')?.value
        if (accessToken && refreshToken) {
          const { data: newSession, error: newError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (newError) { console.error('Error setting session: ', newError.message) }
          if (!newError) { sessionData = newSession }
        }
      }

      if (sessionData.user) {
        locals.user = { id: sessionData.user.id, email: sessionData.user.email }
      }

      // Load user-specific data if user is authenticated
      if (locals.user?.id) {
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', locals.user.id).maybeSingle()
        if (profileError) {
          console.error('Error loading user profile: ', profileError.message)
          return redirect('/outage')
        }

        if (profileData?.name) {
          locals.user = { ...profileData, ...locals.user }

          const { error: activityError } = await locals.supabase.from('profiles').update({ last_activity: new Date() }).eq('id', locals.user.id)
          if (activityError) { console.error(activityError) }
        } else if (url.pathname !== '/onboarding') {
          // go finish profile first
          return redirect(`/onboarding${url.search}`)
        }
      }
    }
    return await next()
  } catch (error) {
    console.error('Server error:', error)
    return new Response('Server error: ' + error.message, { status: 500 })
  }
}
