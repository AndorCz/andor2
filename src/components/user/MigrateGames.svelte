<script>
  import { supabase } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { onMount } from 'svelte'
  export let oldUserData

  let games = []
  const migratingGames = new Set()

  onMount(async () => {
    games = await getGamesByGmId(oldUserData.old_id)
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
        if (result.status === 202) {
          showSuccess('Hra importována')
          migratingGames.add(gameId)
          games = games // trigger reactivity
        } else {
          showError('API failed to import game')
        }
      } catch (error) {
        console.error('Error calling API:', error.toString())
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

<h2>Import hry</h2>

<table>
  <thead>
    <tr>
      <th>Název hry</th>
      <th>Importovat</th>
    </tr>
  </thead>
  <tbody>
    {#each games as game}
      <tr>
        <td>{game.game_name}</td>
        <td>
          {#if game.migrated}
            <button disabled>Hotovo!</button>
          {:else if game.migrating || migratingGames.has(game.id_game)}
            <button disabled>Probíha import</button>
          {:else}
            <button on:click={() => handleGameAction(game.id_game)}>Importovat</button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
