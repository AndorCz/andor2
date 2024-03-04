
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

export function handleError (error, astro) {
  if (typeof window !== 'undefined') {
    if (!window.isWindowClosed) { // ignore fetch errors (cancelled fetches) when the page is closing/reloading
      console.error(error)
      window.showError('Chyba: ' + error.message)
      return Promise.reject(error)
    }
  } else { console.error(error) } // not so helpful, don't use this method on the back-end
}

export async function uploadPortrait (identityId, table, file) {
  const { error: error1 } = await supabase.storage.from('portraits').upload(identityId + '.jpg', file, { upsert: true })
  if (error1) { return handleError(error1) }
  const { error: error2 } = await supabase.from(table).update({ portrait: getHash() }).eq('id', identityId)
  if (error2) { return handleError(error2) }
}

export function getHeaderUrl (type, id) {
  const { data, error } = supabase.storage.from('headers').getPublicUrl(`${type}-${id}.jpg`)
  if (error) { handleError(error) }
  return data.publicUrl
}

export async function getPortrait (identityId, hash) {
  const path = `${identityId}.jpg${hash ? '?hash=' + hash : ''}`
  const { data, error } = await supabase.storage.from('portraits').getPublicUrl(path)
  if (error) { return handleError(error) }
  return data.publicUrl
}

export function getHash () {
  return Math.random().toString(36).slice(-5)
}

// server helpers

/*
const cache = new Map()

export async function fetchWithCache (key, fetcher, ttl = 300) {
  if (cache.has(key)) { // check if the data is in the cache
    const { value, expiry } = cache.get(key)
    if (Date.now() < expiry) { return value } // return cached data if it hasn't expired
  }
  const data = await fetcher() // data not in cache or is expired, fetch new data
  const expiry = Date.now() + ttl * 1000 // TTL in milliseconds
  cache.set(key, { value: data, expiry }) // update cache with new data and expiry time
  return data
}
*/

// browser helpers

export async function sendPost (method = 'POST', data) {
  if (data.content.trim().length === 0) { return window.showError('Příspěvek nesmí být prázdný') }
  const res = await fetch('/api/post', { method, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
  const json = await res.json()
  if (res.error || json.error) { return window.showError(res.error || json.error) }
  return json
}

export async function setRead (userId, slug) {
  if (userId) {
    const { error } = await supabase.rpc('upsert_user_read', { p_user_id: userId, p_slug: slug })
    if (error) { return handleError(error) }
  }
}

export async function getReply (posts, postId) {
  // find post data in posts array
  const post = posts.find(p => p.id === postId)
  if (post) { return post }
  // otherwise get reply data from supabase
  const { data, error } = await supabase.from('posts_owner').select('*').eq('id', postId).maybeSingle()
  if (error) { return handleError(error) }
  return data
}
