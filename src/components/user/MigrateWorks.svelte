<script>
  import { supabase } from '@lib/database-browser'
  import { showSuccess, showError } from '@lib/toasts'
  import { onMount } from 'svelte'

  const { oldUserData } = $props()

  let works = $state([])
  const migratingGames = new Set()

  onMount(async () => {
    works = await getWorksById(oldUserData.old_id)
    works.sort((a, b) => a.name.localeCompare(b.name))
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
        console.error('handleWorkAction - error calling API:', error.message)
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

<div id='works' class='importList'>
  {#each works as work}
    <div class='row'>
      <div class='name'>{work.name}</div>
      <div class='action'>
        {#if work.migrated}
          <button disabled>Hotovo!</button>
        {:else if migratingGames.has(work.id)}
          <button disabled>Probíhá</button>
        {:else}
          <button onclick={() => handleWorkAction(work.id)}>Importovat</button>
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
