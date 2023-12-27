
import { writable } from 'svelte/store'

export const headerPreview = writable(null)

// has to be a function to allow for multiple instances of the store with different names
export const getGameStore = (game) => { // sync temporary preferences to localStorage
  const gameStore = writable(window.localStorage[game] ? JSON.parse(localStorage[game]) : {})
  gameStore.subscribe(value => { window.localStorage.setItem(game, JSON.stringify(value)) })
  return gameStore
}
