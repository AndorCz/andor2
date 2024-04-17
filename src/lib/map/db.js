import { supabase, handleError, getHash } from '@lib/database'
import { showSuccess } from '@lib/toasts'

// database operations for map

export async function saveTransfrom (map, character, x, y, scale) {
  const newTransforms = { ...map.characters, [character.id]: { x, y, scale: scale || 1 } }
  const { error } = await supabase.from('maps').update({ characters: newTransforms }).eq('id', map.id)
  if (error) { handleError(error) }
}

export async function clearCharacter (map, character) {
  const newPositions = { ...map.characters }
  delete newPositions[character.id]
  const newPropositions = { ...map.propositions }
  delete newPropositions[character.id]
  const { error } = await supabase.from('maps').update({ characters: newPositions, propositions: newPropositions }).eq('id', map.id)
  if (error) { handleError(error) }
}

export async function saveProposition (map, character, x, y) {
  const newPropositions = { ...map.propositions, [character.id]: { x, y } }
  const { error } = await supabase.from('maps').update({ propositions: newPropositions }).eq('id', map.id)
  if (error) { handleError(error) }
}

export async function updateMapDescription (map, description) {
  const { error } = await supabase.from('maps').update({ description }).eq('id', map.id)
  if (error) { handleError(error) }
  showSuccess('Popis mapy byl upraven')
}

export async function clearProposition (map, id) {
  const newPropositions = { ...map.propositions }
  delete newPropositions[id]
  const { error } = await supabase.from('maps').update({ propositions: newPropositions }).eq('id', map.id)
  if (error) { handleError(error) }
}

export async function toggleFoW (map, fow) {
  const fowImage = fow ? map.fow_image : null // keep the image hash only if the fow is enabled
  const { error } = await supabase.from('maps').update({ fow, fow_image: fowImage }).eq('id', map.id)
  if (error) { handleError(error) }
}

export async function saveFow (map, blob) {
  if (blob) {
    const { error: uploadError } = await supabase.storage.from('maps').upload(`${map.game}/${map.id}_fow`, blob, { upsert: true })
    if (uploadError) { handleError(uploadError) }
    const { error: hashError } = await supabase.from('maps').update({ fow_image: getHash() }).eq('id', map.id)
    if (hashError) { handleError(hashError) }
  }
}
