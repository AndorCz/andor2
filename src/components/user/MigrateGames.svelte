<script>
  import { supabase } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { onMount } from 'svelte'
  export let oldUserData

  let games = []
  const migratingGames = new Set()

  onMount(async () => {
    games = await getGamesByGmId(oldUserData.old_id)
    games.sort((a, b) => a.game_name.localeCompare(b.game_name))
  })

  async function handleGameAction (gameId) {
    showSuccess('Probíhá import, může chvíli trvat')
    if (gameId) {
      migratingGames.add(gameId)
      games = games // trigger reactivity

      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'migrate_game', gameId })
        })

        const result = await response.json()

        // get http status
        if (response.status === 202) {
          showSuccess('Hra importována')
          migratingGames.add(gameId)
          games = games // trigger reactivity
        } else {
          showError('API failed to import game')
          if (result.error) { console.error(result.error) }
        }
      } catch (error) {
        console.error('handleGameAction - error calling API:', error.toString())
      }
    } else {
      showError('Hra nenalezenena')
    }
  }

  async function getGamesByGmId (oldId) {
    const { data: gamesData, error: gamesError } = await supabase
      .from('old_games')
      .select('game_name, id_game, migrated, migrating')
      .eq('gm_id', parseInt(oldId, 10))

    if (gamesError) {
      showError('Chyba importu: ', gamesError.message)
      return []
    }
    return gamesData
  }
</script>

<h2>Import her</h2>

<div id='games' class='importList'>
  {#each games as game}
    <div class='row'>
      <div class='name'>{game.game_name}</div>
      <div class='action'>
        {#if game.migrated}
          <button disabled>Hotovo!</button>
        {:else if game.migrating || migratingGames.has(game.id_game)}
          <button disabled>Probíhá import</button>
        {:else}
          <button on:click={() => handleGameAction(game.id_game)}>Importovat</button>
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
