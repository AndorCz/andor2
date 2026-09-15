const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

/** Send an automatic private message from the actor to each other storyteller, including the game owner. */
export async function notifyCharacterChange (supabase, { gameId, character, senderId, action }) {
  if (!gameId) { return { error: null } }
  try {
    const { data: game, error } = await supabase.from('games').select('id, name, owner, characters(player, storyteller, accepted, state)').eq('id', gameId).single()
    if (error) { throw error }
    const recipients = new Set([game.owner, ...game.characters.filter(char => char.storyteller && char.accepted && char.state !== 'deleted').map(char => char.player)])
    recipients.delete(senderId)
    const content = `Systémové upozornění: ${escapeHtml(action)}<br>Postava: ${escapeHtml(character.name)}<br>Hra: <a href='/game/${encodeURIComponent(game.id)}?tab=chars'>${escapeHtml(game.name)}</a>`
    const messages = [...recipients].filter(Boolean).map(recipient => ({ sender_user: senderId, recipient_user: recipient, content }))
    if (messages.length) {
      const { error: messageError } = await supabase.from('messages').insert(messages)
      if (messageError) { throw messageError }
    }
    return { error: null }
  } catch (error) {
    return { error: new Error(`Změna postavy byla provedena, ale upozornění vypravěčům se nepodařilo odeslat: ${error.message}`) }
  }
}
