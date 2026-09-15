import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { notifyCharacterChange } from '../src/lib/character-notifications.js'

const storyteller = (player, extra = {}) => ({ player, storyteller: true, accepted: true, state: 'alive', ...extra })
const game = { id: 42, name: 'Hra <a>&', owner: 'owner', characters: [storyteller('owner'), storyteller('assistant'), storyteller('assistant'), storyteller('actor'), storyteller('deleted', { state: 'deleted' }), storyteller('waiting', { accepted: false }), storyteller('player', { storyteller: false }), storyteller(null)] }
const change = { gameId: 42, character: { name: '<img src=x>' }, senderId: 'actor', action: 'Převzal/a jsem postavu hráče <script>.' }

function database (data = game, failTable) {
  const requests = []
  const supabase = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (url, options) => {
        const table = new URL(url).pathname.split('/').pop()
        requests.push({ table, url: String(url), body: options.body && JSON.parse(options.body), method: options.method })
        if (table === failTable) { return new Response(JSON.stringify({ message: 'Database unavailable' }), { status: 500 }) }
        return table === 'games' ? new Response(JSON.stringify(data), { status: 200 }) : new Response(null, { status: 201 })
      }
    }
  })
  return { supabase, requests }
}

test('notifies the owner and all other storytellers once, using the actor as sender', async () => {
  const { supabase, requests } = database()
  assert.equal((await notifyCharacterChange(supabase, change)).error, null)
  assert.equal(requests.length, 2)
  assert.equal(new URL(requests[0].url).searchParams.get('id'), 'eq.42')
  const messages = requests[1].body
  assert.deepEqual(messages.map(message => message.recipient_user), ['owner', 'assistant'])
  assert.ok(messages.every(message => message.sender_user === 'actor'))
  assert.ok(messages.every(message => message.content.includes('/game/42?tab=chars')))
  assert.ok(messages.every(message => message.content.includes('&lt;img src=x&gt;') && message.content.includes('&lt;script&gt;')))
  assert.ok(messages.every(message => !message.content.includes('<script>')))
})

test('owner acting on a character only notifies the other storytellers', async () => {
  const { supabase, requests } = database()
  await notifyCharacterChange(supabase, { ...change, senderId: 'owner' })
  assert.deepEqual(requests[1].body.map(message => message.recipient_user), ['assistant', 'actor'])
})

test('does not send empty batches or notify about characters outside a game', async () => {
  const { supabase, requests } = database({ ...game, owner: 'actor', characters: [storyteller('actor')] })
  assert.equal((await notifyCharacterChange(supabase, change)).error, null)
  assert.equal(requests.length, 1)
  assert.equal((await notifyCharacterChange(supabase, { ...change, gameId: null })).error, null)
  assert.equal(requests.length, 1)
})

for (const table of ['games', 'messages']) {
  test(`reports ${table} failure as an unsent notification after a completed change`, async () => {
    const { supabase, requests } = database(game, table)
    const { error } = await notifyCharacterChange(supabase, change)
    assert.match(error.message, /Změna postavy byla provedena/)
    assert.match(error.message, /Database unavailable/)
    if (table === 'games') { assert.equal(requests.length, 1) }
  })
}
