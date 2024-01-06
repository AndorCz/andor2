
import { createClient } from '@supabase/supabase-js'

// create a supabase client for front-end
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: false, autoRefreshToken: false } }
)

// create new client with access token for back-end for each request
export function getSupabase (accessToken = '') {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { // Set the access token for this specific instance
      auth: { flowType: 'pkce', persistSession: false, detectSessionInUrl: false, autoRefreshToken: false, accessToken }
    }
  )
}

if (typeof window !== 'undefined') {
  // prevention of https://ishwar-rimal.medium.com/typeerror-failed-to-fetch-a-k-a-pain-in-the-ass-fa04dda1514c
  window.addEventListener('unload', () => { window.isWindowClosed = true })
  window.onbeforeunload = () => { window.isWindowClosed = true }
}

export function handleError (error) {
  if (typeof window !== 'undefined') {
    if (!window.isWindowClosed) { // ignore fetch errors (cancelled fetches) when the page is closing/reloading
      console.error(error)
      window.showError('Chyba: ' + error.message)
      return Promise.reject(error)
    }
  } else {
    console.error(error)
  }
}

export async function getActiveUsers (db) { // pass front-end or back-end supabase instance
  const { data, error } = await db.from('profiles').select('last_activity').gte(new Date(Date.now() - 5 * 60 * 1000)) // last five minutes
  if (error) { return handleError(error) }
  return data
}
