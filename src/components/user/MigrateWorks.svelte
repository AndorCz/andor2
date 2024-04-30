<script>
  import { supabase } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { onMount } from 'svelte'
  export let oldUserData

  let works = []
  const migratingGames = new Set()

  onMount(async () => {
    works = await getWorksById(oldUserData.old_id)
  })

  async function handleWorkAction (workId) {
    if (workId) {
      migratingGames.add(workId)
      works = works // trigger reactivity
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'migrate_work', workId })
        })

        const result = await response.json()
        if (result.status === 200) {
          showSuccess('Článek importován')
          works = works // trigger reactivity
        } else {
          showError('API failed to migrate:', result.error)
        }
      } catch (error) {
        console.error('Error calling API:', error.message)
      }
    } else {
      showError('Článek nenalezen')
    }
  }

  async function getWorksById (oldId) {
    const { data: worksData, error: worksError } = await supabase
      .from('old_works')
      .select('id, name, migrated')
      .eq('owner', parseInt(oldId, 10))
    if (worksError) {
      showError('Chyba migrace: ', worksError.message)
      return []
    }
    return worksData
  }
</script>

<h2>Import článků</h2>

<table>
  <thead>
    <tr>
      <th>Název článku</th>
      <th>Importovat</th>
    </tr>
  </thead>
  <tbody>
    {#each works as work}
      <tr>
        <td>{work.name}</td>
        <td>
          {#if work.migrated}
            <button disabled>Hotovo!</button>
          {:else if migratingGames.has(work.id)}
            <button disabled>Probíhá</button>
          {:else}
            <button on:click={() => handleWorkAction(work.id)}>Importovat</button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
