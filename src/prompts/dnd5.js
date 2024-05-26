import { baseStoryteller, baseAssistant } from './base'

const system = `
  Používá se pravidlový systém Dungeons & Dragons 5th edition.
  Hraje se ve světě Forgotten Realms, pokud popis hry neurčí jinak.
`

export const storyteller = `
  ${baseStoryteller.role}
  ${system}
  ${baseStoryteller.goal}
`

export const assistant = `
  ${baseAssistant.role}
  ${system}
  ${baseAssistant.goal}
`
