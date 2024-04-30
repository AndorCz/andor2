<script>
  import { supabase } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { onMount } from 'svelte'
  export let oldUserData

  let chars = []
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
        console.error('Error calling API:', error.message)
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
  })
</script>

<h2>Migrace Postav</h2>

<table>
  <thead>
    <tr>
      <th>Postava</th>
      <th>Migrovat</th>
    </tr>
  </thead>
  <tbody>
    {#each chars as char}
      <tr>
        <td>{char.char_name}</td>
        <td>
          {#if char.migrated}
            <button disabled>Hotovo!</button>
          {:else if migratingChars.has(char.id_char)}
            <button disabled>Probíhá</button>
          {:else}
            <button on:click={() => handleWorkAction(char.id_char)}>
              Migrovat
            </button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
