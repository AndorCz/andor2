import { baseStoryteller, baseAssistant } from './base'

const system = `
  Používá se klasický pravidlový systém Dračí Doupě verze 1.6.
  Hraje se ve světě Asterion, pokud popis hry neurčí jinak.
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

// export const files = ['file-Ae5bz34Q9oFP1zMYTMW4cGNL', 'file-jdgppOijRhvDrnIDkoAfKD9T'] // not permanent, rework
