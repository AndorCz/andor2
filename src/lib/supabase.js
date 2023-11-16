
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: { flowType: "pkce" }
  }
)

export function isUser (cookies) {
  const accessToken = cookies.get('sb-access-token')
  const refreshToken = cookies.get('sb-refresh-token')
  return !!(accessToken && refreshToken)
}