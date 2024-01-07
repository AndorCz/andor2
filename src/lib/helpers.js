import { supabase } from '@lib/database'

// BROWSER HELPERS

export async function sendPost (method = 'POST', data) {
  if (data.content.trim().length === 0) { return window.showError('Příspěvek nesmí být prázdný') }
  const res = await fetch('/api/post', { method, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
  const json = await res.json()
  if (res.error || json.error) { return window.showError(res.error || json.error) }
  return json
}

export async function logout () {
  await supabase.auth.signOut()
  // delete cookies
  document.cookie = 'sb-access-token=; Max-Age=-99999999;'
  document.cookie = 'sb-refresh-token=; Max-Age=-99999999;'
  window.location.href = '/api/auth/logout'
}
