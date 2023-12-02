
import { writable } from 'svelte/store'

export const gameStore = (game, activeTab) => { // sync temporary preferences to localStorage
  const gameStore = writable(window.localStorage[game] ? JSON.parse(localStorage[game]) : { activeTab })
  gameStore.subscribe(value => { window.localStorage.setItem(game, JSON.stringify(value)) })
  return gameStore
}
