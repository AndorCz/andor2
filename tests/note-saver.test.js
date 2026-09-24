import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNoteSaver } from '../src/lib/note-saver.js'

const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

test('debounce persists only the latest edit', async () => {
  const writes = []
  const saver = createNoteSaver(async value => writes.push(value), () => {}, 15)
  saver.enqueue({ content: 'A' })
  saver.enqueue({ content: 'AB' })
  await pause(40)
  assert.deepEqual(writes, [{ content: 'AB' }])
  assert.equal(saver.isDirty(), false)
  saver.destroy()
})

test('an edit made during an in-flight save is serialized after it', async () => {
  const writes = []
  let finish
  const saver = createNoteSaver(async value => {
    writes.push(value.content)
    if (writes.length === 1) { await new Promise(resolve => { finish = resolve }) }
  }, () => {}, 1000)
  saver.enqueue({ content: 'old' })
  const first = saver.flush()
  saver.enqueue({ content: 'new' })
  const second = saver.flush()
  assert.deepEqual(writes, ['old'])
  finish()
  await Promise.all([first, second])
  assert.deepEqual(writes, ['old', 'new'])
  assert.equal(saver.isDirty(), false)
  saver.destroy()
})

test('failed saves retain the draft and can be retried', async () => {
  let fail = true
  let stored
  const states = []
  const saver = createNoteSaver(async value => {
    if (fail) { throw new Error('offline') }
    stored = value
  }, state => states.push(state), 1000)
  saver.enqueue({ content: 'draft' })
  await assert.rejects(saver.flush(), /offline/)
  assert.equal(saver.isDirty(), true)
  assert.equal(states.at(-1), 'error')
  fail = false
  await saver.flush()
  assert.deepEqual(stored, { content: 'draft' })
  assert.equal(states.at(-1), 'saved')
  assert.equal(saver.isDirty(), false)
  saver.destroy()
})

test('a failed request never replaces a newer pending draft', async () => {
  let reject
  let fail = true
  const writes = []
  const saver = createNoteSaver(async value => {
    if (fail) { await new Promise((resolve, failure) => { reject = failure }) }
    writes.push(value.content)
  }, () => {}, 1000)
  saver.enqueue({ content: 'old' })
  const saving = saver.flush()
  saver.enqueue({ content: 'new' })
  reject(new Error('offline'))
  await assert.rejects(saving)
  fail = false
  await saver.flush()
  assert.deepEqual(writes, ['new'])
  saver.destroy()
})
