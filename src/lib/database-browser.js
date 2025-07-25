import { createBrowserClient } from '@supabase/ssr'
import { getImageUrl } from '@lib/utils'

// front-end
export const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)

// prevention of https://ishwar-rimal.medium.com/typeerror-failed-to-fetch-a-k-a-pain-in-the-ass-fa04dda1514c
window.addEventListener('unload', () => { window.isWindowClosed = true })
window.onbeforeunload = () => { window.isWindowClosed = true }

export function handleError (error) {
  if (!window.isWindowClosed) { // ignore fetch errors (cancelled fetches) when the page is closing/reloading
    console.error(error)
    window.showError('Chyba: ' + error.message)
    return Promise.reject(error)
  }
}

export function getHeaderUrl (type, id, hash) {
  return getImageUrl(supabase, `${type}-${id}.jpg?hash=${hash}`, 'headers')
}

export function getPortraitUrl (identityId, hash) {
  return getImageUrl(supabase, `${identityId}.jpg${hash ? '?hash=' + hash : ''}`, 'portraits')
}

export function getWorkFileUrl (path) {
  return getImageUrl(supabase, path, 'works')
}

export async function sendPost (method = 'POST', data) {
  try {
    if (data.content.trim().length === 0) { return window.showError('Příspěvek nesmí být prázdný') }
    const res = await fetch('/api/post', { method, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { throw new Error(res.error || json.error) }
    return json
  } catch (error) {
    console.error(error)
    window.showError('Chyba při odesílání příspěvku: ' + error.message)
    return { error: error.message }
  }
}

export async function setRead (userId, threadId) {
  if (userId && threadId) {
    const { error } = await supabase.rpc('thread_read', { p_user_id: userId, p_thread_id: threadId })
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

export async function userAutocomplete (name) {
  const { data, error } = await supabase.from('profiles').select('id, name').ilike('name', '%' + name + '%').limit(5)
  if (error) { return handleError(error) }
  return data
}

export async function deleteStorageFolder (bucket, folder) {
  const { data: listData, error: listError } = await supabase.storage.from(bucket).list(folder)
  if (listError) { return listError }
  const filesToRemove = listData.map((file) => `${folder}/${file.name}`)
  const { error: removeError } = await supabase.storage.from(bucket).remove(filesToRemove)
  if (removeError) { return { error: removeError } }
  return { data: { success: true } }
}
