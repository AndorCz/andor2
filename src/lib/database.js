
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: { flowType: 'pkce' }
  }
)

export function isUser (cookies) {
  const accessToken = cookies.get('sb-access-token')
  const refreshToken = cookies.get('sb-refresh-token')
  return !!(accessToken && refreshToken)
}

export async function getUser (cookies) {
  let user, profile
  try {
    // get user
    const { data, error } = await supabase.auth.getSession()
    if (error) { console.error(error) }
    user = (isUser(cookies) && data.session) ? data.session.user : undefined

    if (user?.id) {
      // get profile
      const profileResponse = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (profileResponse.error) { console.error(profileResponse.error) }
      profile = profileResponse.data
    }
  } catch (e) { console.error(e) }
  return { user, profile }
}

export async function getProfile (uid) {
  return data
}