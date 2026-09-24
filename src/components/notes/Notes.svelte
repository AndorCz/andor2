<script>
  import { onMount, tick } from 'svelte'
  import DOMPurify from 'dompurify'
  import { supabase } from '@lib/database-browser'
  import NoteEditor from './NoteEditor.svelte'

  const { user } = $props()
  let notes = $state([])
  let games = $state([])
  let selectedId = $state(null)
  let editor = $state()
  let notebook = $state()
  let menu = $state()
  let backButton = $state()
  let mobile = $state(false)
  let detailOpen = $state(false)
  let listScroll = 0
  let loading = $state(true)
  let busy = $state(false)
  let error = $state('')
  const selected = $derived(notes.find(note => note.id === selectedId))
  const groups = $derived([
    { id: null, name: 'Bez hry' },
    ...games,
    ...[...new Set(notes.map(note => note.game).filter(id => id && !games.some(game => game.id === id)))].map(id => ({ id, name: 'Dřívější hra' }))
  ].map(game => ({ ...game, notes: notes.filter(note => note.game === game.id) })).filter(group => group.id === null || group.notes.length))

  onMount(() => {
    const media = window.matchMedia('(max-width: 650px)')
    const resize = () => { mobile = media.matches }
    resize()
    media.addEventListener('change', resize)
    load()
    return () => media.removeEventListener('change', resize)
  })

  function updateUrl (id) {
    const url = new URL(window.location.href)
    if (id) { url.searchParams.set('id', id) } else { url.searchParams.delete('id') }
    window.history.replaceState(window.history.state, '', url)
  }

  async function openDetail () {
    if (mobile && !detailOpen) { listScroll = window.scrollY }
    detailOpen = true
    await tick()
    if (mobile) {
      notebook.scrollIntoView({ block: 'start' })
      backButton?.focus({ preventScroll: true })
    }
  }

  async function back () {
    if (busy) { return }
    busy = true
    if (!editor || await editor.flush()) {
      detailOpen = false
      updateUrl(null)
      busy = false
      await tick()
      window.scrollTo({ top: listScroll })
      menu.querySelector('[aria-current="true"]')?.focus({ preventScroll: true })
    }
    busy = false
  }

  async function load () {
    if (editor && !await editor.flush()) { return }
    loading = true
    error = ''
    try {
      const results = await Promise.all([
        supabase.from('notes').select('*').eq('owner', user.id).order('updated_at', { ascending: false }),
        supabase.from('games').select('id, name').eq('owner', user.id),
        supabase.from('characters').select('game:games(id, name)').eq('player', user.id).eq('accepted', true).not('game', 'is', null)
      ])
      const failure = results.find(result => result.error)?.error
      if (failure) { throw failure }
      notes = results[0].data
      games = [...new Map([...results[1].data, ...results[2].data.map(character => character.game).filter(Boolean)].map(game => [game.id, game])).values()].sort((a, b) => a.name.localeCompare(b.name, 'cs'))
      const requestedId = new URL(window.location.href).searchParams.get('id')
      selectedId = requestedId || notes[0]?.id || null
      detailOpen = !!requestedId && notes.some(note => note.id === requestedId)
      if (requestedId && !notes.some(note => note.id === requestedId)) { error = 'Poznámka neexistuje nebo k ní nemáš přístup.' }
    } catch { error = 'Poznámky se nepodařilo načíst. Zkus to znovu.' }
    loading = false
  }

  async function select (id) {
    if (busy) { return }
    if (id === selectedId) { updateUrl(id); await openDetail(); return }
    busy = true
    if (!editor || await editor.flush()) {
      selectedId = id
      updateUrl(id)
      await openDetail()
    }
    busy = false
  }

  async function create () {
    if (busy) { return }
    busy = true
    if (editor && !await editor.flush()) { busy = false; return }
    const { data, error: failure } = await supabase.from('notes').insert({ owner: user.id }).select().single()
    busy = false
    if (failure) { error = 'Poznámku se nepodařilo vytvořit.'; return }
    notes = [data, ...notes]
    await select(data.id)
  }

  function update (note) { notes = notes.map(item => item.id === note.id ? note : item) }
  function remove (id) {
    notes = notes.filter(note => note.id !== id)
    selectedId = notes[0]?.id || null
    editor = null
    detailOpen = false
    updateUrl(mobile ? null : selectedId)
  }

  function preview (content) {
    const element = document.createElement('div')
    element.innerHTML = DOMPurify.sanitize(content)
    return (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 130) || 'Prázdná poznámka'
  }
</script>

<h1>Poznámky</h1>
{#if loading}
  <p role='status'>Načítám poznámky…</p>
{:else}
  {#if error}<p role='alert'>{error} <button onclick={load}>Zkusit znovu</button></p>{/if}
  <div class='notebook' class:detail-open={detailOpen} bind:this={notebook}>
    <nav aria-label='Seznam poznámek' bind:this={menu} inert={mobile && detailOpen}>
      <button class='create' onclick={create} disabled={busy}><span class='material'>add</span>Nová poznámka</button>
      {#each groups as group (group.id)}
        <h3>{group.name}</h3>
        {#each group.notes as note (note.id)}
          <button class='entry' class:active={selectedId === note.id} aria-current={selectedId === note.id ? 'true' : undefined} onclick={() => select(note.id)} disabled={busy}><strong>{note.title || 'Bez názvu'}</strong><span>{preview(note.content)}</span></button>
        {/each}
      {/each}
      {#if !notes.length}<p>Zatím tu nemáš žádné poznámky.</p>{/if}
    </nav>
    <div class='detail' inert={mobile && !detailOpen}>
      <button class='back secondary' bind:this={backButton} onclick={back} disabled={busy}><span class='material' aria-hidden='true'>arrow_back</span>Zpět na poznámky</button>
      {#if selected}
        {#key selected.id}<NoteEditor bind:this={editor} {user} note={selected} {games} onUpdate={update} onDelete={remove} />{/key}
      {:else}<p>Vyber poznámku nebo si vytvoř novou.</p>{/if}
    </div>
  </div>
{/if}

<style>
  .notebook { display: grid; grid-template-columns: minmax(180px, 28%) minmax(0, 1fr); gap: 25px; }
  nav { min-width: 0; }
  h3 { font-size: 17px; margin: 25px 0 10px; color: var(--dim); }
  .create { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px; }
  .entry { display: block; width: 100%; padding: 14px; margin-bottom: 8px; text-align: left; background: var(--prominent); color: color-mix(in srgb, var(--text), #fff 20%); border: 1px solid transparent; box-shadow: none; }
  .entry:not(.active) { border: 1px color-mix(in srgb, var(--prominent), var(--accent) 15%) solid; }
  .entry:not(.active):not(:disabled):hover { background: color-mix(in srgb, var(--prominent), #fff 8%); }
  .entry.active { background: var(--inputBg); box-shadow: inset 0 2px 6px #0006, inset 0 0 0 1px #0003; }
  .entry:focus-visible { outline: 2px solid var(--link); outline-offset: 2px; }
  .entry strong, .entry span { display: block; overflow: hidden; text-overflow: ellipsis; }
  .entry strong { white-space: nowrap; }
  .entry span { margin-top: 5px; color: inherit; font-size: 15px; font-weight: 400; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .detail { min-width: 0; }
  .back { display: none; }
  @media (max-width: 650px) {
    .notebook { grid-template-columns: minmax(0, 1fr); overflow: clip; }
    nav, .detail { grid-area: 1 / 1; }
    nav { padding: 3px; }
    .detail { display: none; }
    .detail-open nav { visibility: hidden; height: 0; overflow: hidden; }
    .detail-open .detail { display: block; position: relative; z-index: 1; background: var(--panel); min-height: 75svh; animation: open-note 180ms ease-out; }
    .back { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 10px 0; }
  }
  @keyframes open-note {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .detail-open .detail { animation: none; }
  }
</style>
