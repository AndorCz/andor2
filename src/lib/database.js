
import { createServerClient, createBrowserClient } from '@supabase/ssr'

// front-end
export const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)

// back-end
export function getSupabase (cookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get (key) { return cookies.get(key)?.value },
        set (key, value, options) { cookies.set(key, value, options) },
        remove (key, options) { cookies.delete(key, options) }
      }
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
  const fiveMinutesAgoISO = new Date(new Date() - (5 * 60 * 1000)).toISOString()
  const { data, error } = await db.from('profiles').select('*').gte('last_activity', fiveMinutesAgoISO)
  if (error) { return handleError(error) }
  return data
}
