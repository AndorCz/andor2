<script>
  import { onMount } from 'svelte'
  import DOMPurify from 'dompurify'
  import { supabase } from '@lib/database-browser'

  const { token } = $props()
  let note = $state(null)
  let loading = $state(true)
  let error = $state('')
  onMount(load)

  async function load () {
    loading = true
    error = ''
    const { data, error: failure } = await supabase.rpc('read_shared_note', { token }).maybeSingle()
    if (failure) { error = 'Poznámku se nepodařilo načíst.' } else { note = data }
    loading = false
  }
</script>

{#if loading}<p role='status'>Načítám poznámku…</p>
{:else if error}<p role='alert'>{error} <button onclick={load}>Zkusit znovu</button></p>
{:else if note}
  <h1>{note.title || 'Bez názvu'}</h1>
  <p class='hint'>Sdílená poznámka · pouze pro čtení</p>
  <article class='editableLong'>{@html DOMPurify.sanitize(note.content)}</article>
{:else}<h1>Poznámka není dostupná</h1><p>Odkaz je neplatný nebo bylo sdílení zrušeno.</p>{/if}

<style>
  article { overflow-wrap: anywhere; line-height: 1.5; }
  article :global(img) { max-width: 100%; }
  .hint { color: var(--dim); }
</style>
