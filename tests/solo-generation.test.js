import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { StreamingJSONParser } from '../src/lib/solo/streaming-json-parser.js'
import { retryStoryteller } from '../src/lib/solo/retry-storyteller.js'

const data = { character: { slug: 'narrator' }, post: '<p>Novy prispevek.</p>', nsfw: false }
const source = readFileSync(new URL('../src/pages/api/solo/generatePost.js', import.meta.url), 'utf8')
const body = source.match(/async function \* generateStreamData \(\) \{([\s\S]*?)\n {6}\}\n\n {6}const stream/)[1]
const AsyncGeneratorFunction = Object.getPrototypeOf(async function * () {}).constructor

async function generate (content, finishReason = 'stop', retryContent = JSON.stringify(data)) {
  const calls = []
  const saved = []
  const response = (async function * () {
    for (let i = 0; i < content.length; i += 7) { yield { choices: [{ delta: { content: content.slice(i, i + 7) } }] } }
    yield { choices: [{ delta: {}, finish_reason: finishReason }] }
  })()
  const dependencies = {
    response,
    StreamingJSONParser,
    retryStoryteller,
    ai: { chat: { completions: { create: async params => { calls.push(params); return { choices: [{ message: { content: retryContent }, finish_reason: 'stop' }] } } } } },
    storytellerParams: { model: 'deepseek-v4-flash', messages: [{ role: 'system', content: 'Return JSON' }] },
    npcs: [{ id: 'npc', slug: 'narrator' }],
    conceptData: { storyteller: 'npc' },
    gameData: { thread: 'thread' },
    postHash: 'hash',
    addPost: async (...args) => saved.push(args),
    console: { warn () {}, error () {} }
  }
  const events = []
  for await (const event of new AsyncGeneratorFunction(...Object.keys(dependencies), body)(...Object.values(dependencies))) { events.push(event) }
  return { calls, saved, events }
}

test('complete streamed JSON is saved without retry', async () => {
  const result = await generate(JSON.stringify(data))
  assert.equal(result.calls.length, 0)
  assert.equal(result.saved.length, 1)
  assert.deepEqual(result.saved[0][3], data)
})

test('unfinished post is regenerated and replaces the partial preview, then saved once', async () => {
  for (const reason of ['stop', 'length', 'insufficient_system_resource', null]) {
    const result = await generate('{"character":{"slug":"narrator"},"post":"Unfinished', reason)
    assert.equal(result.calls.length, 1)
    assert.equal(result.calls[0].stream, false)
    assert.equal(result.saved.length, 1)
    assert.deepEqual(result.saved[0][3], data)
    assert.deepEqual(result.events.find(event => event.replacePost).replacePost.post, data.post)
    assert.ok(!result.events.some(event => event.error))
  }
})

test('empty or whitespace-only stream is retried once', async () => {
  for (const content of ['', '  \n']) {
    const result = await generate(content)
    assert.equal(result.calls.length, 1)
    assert.equal(result.saved.length, 1)
  }
})

test('another incomplete response stops after one retry without saving', async () => {
  const result = await generate('{', 'stop', '{"post":"unfinished')
  assert.equal(result.calls.length, 1)
  assert.equal(result.saved.length, 0)
  assert.ok(result.events.some(event => event.error))
  assert.ok(!result.events.some(event => event.replacePost))
})

test('completed post with truncated metadata remains recoverable', async () => {
  const result = await generate('{"character":{"slug":"narrator"},"post":"Finished", "image":', 'length')
  assert.equal(result.calls.length, 0)
  assert.equal(result.saved[0][3].post, 'Finished')
  assert.equal(result.saved[0][3].nsfw, true)
})

test('filtered stream is neither retried nor saved', async () => {
  const result = await generate(JSON.stringify(data), 'content_filter')
  assert.equal(result.calls.length, 0)
  assert.equal(result.saved.length, 0)
  assert.ok(result.events.some(event => event.error))
})

test('retry rejects missing post and safety metadata or a filtered response', async () => {
  for (const content of ['null', '{}', '{"post":"text","character":{"slug":"narrator"}}']) {
    const result = await generate('{', 'stop', content)
    assert.equal(result.saved.length, 0)
    assert.ok(result.events.some(event => event.error))
  }
  const ai = { chat: { completions: { create: async () => ({ choices: [{ finish_reason: 'content_filter', message: { content: JSON.stringify(data) } }] }) } } }
  await assert.rejects(retryStoryteller(ai, { messages: [] }), /filtrem/)
})

test('browser reassembles split UTF-8 SSE messages and replaces the unfinished post', async () => {
  const source = readFileSync(new URL('../src/components/solo/SoloGame.svelte', import.meta.url), 'utf8')
  const body = source.match(/async function generateResponse \(\) \{([\s\S]*?)\n {2}\}\n\n {2}function showSettings/)[1]
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const character = { id: 'npc', name: 'Vypravěč' }
  const post = '<p>Příliš žluťoučký kůň.</p>'
  const events = [{ character }, { post: 'unfinished' }, { replacePost: { character, post } }]
  const bytes = new TextEncoder().encode(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''))
  const displayedPosts = []
  const user = { solo_limit: 10 }
  let index = 0
  const dependencies = {
    isGenerating: false,
    getStamp: () => 'hash',
    displayedPosts,
    allPosts: [],
    showPost: post => displayedPosts.push(post),
    game: { id: 'game', thread: 'thread' },
    character,
    user,
    postsEl: null,
    fetch: async () => ({ ok: true, body: { getReader: () => ({ read: async () => index < bytes.length ? { value: bytes.slice(index, ++index), done: false } : { done: true } }) } }),
    supabase: { from: () => ({ select: () => ({ match: () => ({ maybeSingle: async () => ({ data: { id: 'saved' } }) }) }) }) },
    showError: message => assert.fail(message),
    handleError: error => { throw error }
  }
  await new AsyncFunction(...Object.keys(dependencies), body)(...Object.values(dependencies))
  assert.equal(displayedPosts.length, 1)
  assert.equal(displayedPosts[0].content, post)
  assert.equal(displayedPosts[0].id, 'saved')
  assert.equal(user.solo_limit, 9)
})
