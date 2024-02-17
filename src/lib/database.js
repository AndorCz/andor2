
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

export function getHeaderUrl (type, id) {
  const { data, error } = supabase.storage.from('headers').getPublicUrl(`${type}-${id}`)
  if (error) { handleError(error) }
  return data.publicUrl
}

export async function getActiveUsers (db) { // pass front-end or back-end supabase instance
  const fiveMinutesAgoISO = new Date(new Date() - (5 * 60 * 1000)).toISOString()
  const { data, error } = await db.from('profiles').select('*').gte('last_activity', fiveMinutesAgoISO)
  if (error) { return handleError(error) }
  return data
}

export async function getUnreadConversations (db, userId) {
  const { data, error } = await db.from('messages').select('id, sender(*)').match({ recipient: userId, read: false })
  if (error) { return handleError(error) }
  // aggregate number of unread messages per sender (2DO: replace with group by, once supported by supabase-js)
  const unreadConversations = {}
  data.forEach((message) => {
    if (unreadConversations[message.sender.id]) {
      unreadConversations[message.sender.id].unread++
    } else {
      message.sender.unread = 1
      unreadConversations[message.sender.id] = message.sender
    }
  })
  return unreadConversations
}

export async function getConversations (db, userId) {
  const { data, error } = await db.from('messages').select('id, sender(*)').or(`recipient.eq.${userId},sender.eq.${userId})`)
  if (error) { return handleError(error) }
  // aggregate number of unread messages per sender (2DO: replace with group by, once supported by supabase-js)
  const conversations = {}
  data.forEach((message) => { conversations[message.sender.id] = message.sender })
  return conversations
}

// server helpers

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
    const { error } = await supabase.from('user_reads').upsert({ user_id: userId, slug })
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
