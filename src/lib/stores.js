
import { writable } from 'svelte/store'

export const headerPreview = writable(null)
export const conversations = writable({})
export const unreadConversations = writable({})

// has to be a function to allow for multiple instances of the store with different names
export function getGameStore (game, def = {}) { // sync temporary preferences to localStorage
  const gameStore = writable(window.localStorage[game] ? JSON.parse(localStorage[game]) : def)
  gameStore.subscribe(value => { window.localStorage.setItem(game, JSON.stringify(value)) })
  return gameStore
}

export function getUserStore (def = {}) { // sync temporary preferences to localStorage
  const userStore = writable(window.localStorage.user ? JSON.parse(localStorage.user) : def)
  userStore.subscribe(value => { window.localStorage.setItem('user', JSON.stringify(value)) })
  return userStore
}
