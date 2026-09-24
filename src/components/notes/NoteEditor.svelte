<script>
  import { onMount, onDestroy, untrack, tick } from 'svelte'
  import { supabase } from '@lib/database-browser'
  import { createNoteSaver } from '@lib/note-saver'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  const { user, note, games, onUpdate, onDelete } = $props()
  let title = $state(note.title)
  let content = $state(note.content)
  let game = $state(note.game)
  let shareToken = $state(note.share_token)
  let status = $state('saved')
  let error = $state('')
  let busy = $state(false)
  let copied = $state(false)
  let lastQueued = JSON.stringify({ title: note.title, content: note.content, game: note.game, share_token: note.share_token })
  const labels = { saved: 'Uloženo', pending: 'Čeká na uložení', saving: 'Ukládám…', error: 'Uložení selhalo' }
  const icons = { saved: 'done', pending: 'schedule', saving: 'hourglass_top', error: 'warning' }
  const saver = createNoteSaver(async data => {
    const { data: saved, error: failure } = await supabase.from('notes').update(data).eq('id', note.id).eq('owner', user.id).select('id').single()
    if (failure || !saved) { throw failure || new Error('Poznámka již neexistuje') }
  }, state => { status = state })

  $effect(() => {
    const data = { title, content, game, share_token: shareToken }
    const serialized = JSON.stringify(data)
    if (serialized !== lastQueued) {
      lastQueued = serialized
      saver.enqueue(data)
      untrack(() => onUpdate({ ...note, ...data }))
    }
  })

  onMount(() => {
    const beforeUnload = event => {
      if (saver.isDirty()) { event.preventDefault(); event.returnValue = '' }
    }
    const navigate = async event => {
      const link = event.target.closest?.('a[href]')
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download') || !saver.isDirty()) { return }
      event.preventDefault()
      event.stopImmediatePropagation()
      if (await flush()) { window.location.assign(link.href) }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', navigate, true)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', navigate, true)
    }
  })
  onDestroy(() => saver.destroy())

  export async function flush () {
    await tick()
    try {
      await saver.flush()
      error = ''
      return true
    } catch (failure) {
      error = 'Poznámku se nepodařilo uložit. Zkontroluj připojení a zkus to znovu.'
      return false
    }
  }

  async function share () {
    busy = true
    shareToken ||= crypto.randomUUID()
    // Flush explicitly, including a freshly generated token before Svelte's next effect.
    saver.enqueue({ title, content, game, share_token: shareToken })
    if (await flush()) {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/notes/shared/${shareToken}`)
        copied = true
      } catch { error = 'Odkaz zkopíruj z pole níže.' }
    }
    busy = false
  }

  async function unshare () {
    busy = true
    shareToken = null
    copied = false
    saver.enqueue({ title, content, game, share_token: null })
    await flush()
    busy = false
  }

  async function remove () {
    if (!window.confirm(`Smazat poznámku „${title || 'Bez názvu'}“?`)) { return }
    busy = true
    if (await flush()) {
      const { error: failure } = await supabase.from('notes').delete().eq('id', note.id).eq('owner', user.id).select('id').single()
      if (failure) { error = 'Poznámku se nepodařilo smazat.' } else { onDelete(note.id) }
    }
    busy = false
  }
</script>

<section class='note-editor'>
  <header>
    <input type='text' aria-label='Název poznámky' placeholder='Bez názvu' maxlength='200' bind:value={title} />
    <span class='material save-status' class:failed={status === 'error'} title={labels[status]} aria-hidden='true'>{icons[status]}</span>
  </header>
  <div class='options'>
    <label>Hra <select bind:value={game}><option value={null}>Bez hry</option>{#each games as item (item.id)}<option value={item.id}>{item.name}</option>{/each}{#if game && !games.some(item => item.id === game)}<option value={game}>Dřívější hra</option>{/if}</select></label>
    <button class='material square' title='Sdílet odkaz pro čtení' aria-label='Sdílet odkaz pro čtení' onclick={share} disabled={busy}>share</button>
    <button class='material square' title='Smazat poznámku' aria-label='Smazat poznámku' onclick={remove} disabled={busy}>delete</button>
  </div>
  <span class='sr-only' role='status'>{labels[status]}</span>
  {#if error || status === 'error'}<p role='alert'>{error || 'Uložení selhalo. Zkus to znovu.'} <button onclick={flush}>Zkusit znovu</button></p>{/if}
  {#if shareToken}
    <div class='sharing'><input readonly aria-label='Sdílený odkaz' value={`${window.location.origin}/notes/shared/${shareToken}`} /><button onclick={unshare} disabled={busy}>Zrušit sdílení</button></div>
    <p class='hint'>{copied ? 'Odkaz zkopírován. ' : ''}Kdokoli s odkazem může poznámku číst.</p>
  {/if}
  <TextareaExpandable {user} bind:value={content} allowHtml immediate minHeight={420} onSave={flush} disableEmpty={false} />
</section>

<style>
  .note-editor { min-width: 0; }
  header, .options, .sharing { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
  .save-status { flex-shrink: 0; padding: 10px; color: var(--dim); }
  header input { flex: 1; min-width: 0; font-size: 24px; }
  .options label { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
  select { min-width: 0; max-width: 100%; }
  .sharing input { flex: 1; min-width: 0; font-size: 14px; }
  .hint { font-size: 14px; color: var(--dim); }
  .failed, [role='alert'] { color: var(--new); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
