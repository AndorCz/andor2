<script>
  import { supabase } from '@lib/database-browser'
  import { showSuccess, showError } from '@lib/toasts'
  import { onMount } from 'svelte'

  let chars = $state([])
  const { oldUserData } = $props()
  const migratingChars = new Set()

  async function handleWorkAction (charId) {
    if (charId) {
      migratingChars.add(charId)
      chars = chars // trigger reactivity
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'migrate_char', charId })
        })

        const result = await response.json()
        if (result.status === 200) {
          showSuccess('Postava zmigrována!')
          chars = chars // trigger reactivity
        } else {
          showError('API failed to migrate:', result.error)
        }
      } catch (error) {
        console.error('handleWorkAction - error calling API:', error.message)
      }
    } else {
      showError('Chyba - postava nenalezena')
    }
  }

  async function getCharactersById (oldId) {
    const { data, error } = await supabase
      .from('old_chars')
      .select('id_char, char_name, migrated')
      .eq('id_user', parseInt(oldId, 10))
      .eq('gm_id', 0)
    if (error) {
      showError('Chyba migrace: ', error.message)
      return []
    }
    return data
  }

  onMount(async () => {
    chars = await getCharactersById(oldUserData.old_id)
    chars.sort((a, b) => a.char_name.localeCompare(b.char_name))
  })
</script>

<h2>Migrace Postav</h2>

<div id='chars' class='importList'>
  {#each chars as char}
    <div class='row'>
      <div class='name'>{char.char_name}</div>
      <div class='action'>
        {#if char.migrated}
          <button disabled>Hotovo!</button>
        {:else if migratingChars.has(char.id_char)}
          <button disabled>Probíhá</button>
        {:else}
          <button onclick={() => handleWorkAction(char.id_char)}>
            Migrovat
          </button>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin-bottom: 1px;
    background-color: var(--block);
  }
  .name {
    flex: 1;
  }
  .action {
    flex: 0;
  }
</style>
