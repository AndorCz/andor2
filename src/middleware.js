import { createServerClient, parseCookieHeader } from '@supabase/ssr'

export async function onRequest ({ request, cookies, locals, redirect, url, context }, next) {
  try {
    locals.user = {} // default empty user object

    const accessToken = cookies.get('sb-access-token')?.value
    const refreshToken = cookies.get('sb-refresh-token')?.value

    const env = import.meta.env || context.locals.runtime.env
    if (!env.PUBLIC_SUPABASE_URL) throw new Error('Missing environment variables')

    const supabase = createServerClient(
      env.PUBLIC_SUPABASE_URL,
      env.PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { autoRefreshToken: false },
        cookies: {
          getAll () { return parseCookieHeader(request.headers.get('Cookie') ?? '') },
          setAll (cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookies.set(name, value, options))
          }
        }
      }
    )
    locals.supabase = supabase

    if (accessToken && refreshToken) {
      const { data: authData, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })

      if (error) {
        console.log('auth error', error.message)
        // cookies.delete('sb-access-token')
        // cookies.delete('sb-refresh-token')
      } else {
        if (authData.user) {
          // saveAuthCookies(cookies, authData.session)
          locals.user = { id: authData.user.id, email: authData.user.email }
        }

        // Load user-specific data if user is authenticated
        if (locals.user?.id) {
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', locals.user.id).maybeSingle()
          if (profileData?.name) {
            locals.user = { ...profileData, ...locals.user }
            const { error: profileError } = await locals.supabase.from('profiles').update({ last_activity: new Date() }).eq('id', locals.user.id)
            if (profileError) { throw profileError }
          } else if (url.pathname !== '/onboarding') {
            // go finish profile first
            return redirect(`/onboarding${url.search}`)
          }
        }
      }
    }

    return await next()
  } catch (error) {
    console.error('Server error:', error)
    return new Response('Server error: ' + error.message, { status: 500 })
  }
}
