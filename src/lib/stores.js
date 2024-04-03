
import { writable } from 'svelte/store'

export const headerPreview = writable(null)
export const activeConversation = writable(null)
export const bookmarks = writable({ games: [], boards: [], works: [] })
export const lightboxImage = writable(null)

// LOCAL STORAGE SYNCED STORE: has to be a function to allow for multiple instances of the store with different names

export function getSavedStore (key, def = {}) {
  const store = writable(window.localStorage[key] ? JSON.parse(localStorage[key]) : def)
  store.subscribe(value => { window.localStorage.setItem(key, JSON.stringify(value)) })
  return store
}
