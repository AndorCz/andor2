import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/components/games/characters/Character.svelte', import.meta.url), 'utf8')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

function action (name, { confirm = true, rpcError = null, updateError = null } = {}) {
  const calls = []
  const supabase = {
    rpc: async () => { calls.push('rpc'); return { data: rpcError ? null : 'copy', error: rpcError } },
    from: table => {
      calls.push(table)
      return {
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ error: updateError }) }) }) }),
        insert: async () => ({ error: null })
      }
    }
  }
  const body = source.match(new RegExp(`async function ${name} \\([^\\n]*\\) \\{([\\s\\S]*?)\\n  \\}\\n`))[1]
  const dependencies = { supabase, window: { confirm: () => confirm }, character: { id: 'character', name: 'Hero', player: { id: 'player' } }, user: { id: 'assistant' }, handleError: error => { throw error }, charactersChanged: async text => { calls.push(['notification', text]) }, copyCharacterPortrait: async () => { calls.push('portrait') }, redirectWithToast: () => { calls.push('redirect') }, own: false }
  return { calls, run: () => new AsyncFunction(...Object.keys(dependencies), body)(...Object.values(dependencies)) }
}

test('cancelling removal of another player does not change or notify', async () => {
  const { run, calls } = action('killCharacter', { confirm: false })
  await run()
  assert.deepEqual(calls, [])
})

test('failed takeover stops before death and notifications', async () => {
  const { run, calls } = action('killCharacter', { rpcError: new Error('Denied') })
  await assert.rejects(run, /Denied/)
  assert.deepEqual(calls, ['rpc'])
})

test('successful removal notifies storytellers and the affected player', async () => {
  const { run, calls } = action('killCharacter')
  await run()
  assert.deepEqual(calls.filter(call => typeof call === 'string'), ['rpc', 'portrait', 'characters', 'messages', 'redirect'])
  assert.equal(calls.filter(Array.isArray).length, 1)
  assert.match(calls.find(Array.isArray)[1], /Hráč byl vyřazen a dostal kopii/)
})

test('failed rejection never sends rejection messages', async () => {
  const { run, calls } = action('rejectCharacter', { rpcError: new Error('Denied') })
  await assert.rejects(run, /Denied/)
  assert.deepEqual(calls, ['rpc'])
})

test('zero updated rows or a rejected update never sends a notification', async () => {
  const { run, calls } = action('reviveCharacter', { updateError: new Error('No rows') })
  await assert.rejects(run, /No rows/)
  assert.deepEqual(calls, ['characters'])
})
