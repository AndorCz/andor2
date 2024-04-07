<script>
  import { isFilledArray } from '@lib/utils'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database'
  import Map from '@components/games/maps/Map.svelte'

  export let user
  export let game
  export let isStoryteller

  async function deleteMap (mapId) {
    if (confirm('Opravdu chcete smazat tuto mapu?')) {
      const { error } = await supabase.from('maps').delete().eq('id', mapId)
      if (error) { handleError(error) }
      const { error: storageError } = await supabase.storage.from('maps').remove([`${game.id}/${mapId}`])
      if (storageError) { handleError(storageError) }
      game.maps = game.maps.filter(map => map.id !== mapId)
      showSuccess('Mapa byla smazána')
    }
  }
</script>

<div class='maps'>
  {#if isFilledArray(game.maps)}
    {#each game.maps as map}
      {#if !map.hidden || isStoryteller}
        <Map {user} {game} {map} {isStoryteller} isActive={map.id === game.active_map?.id} onDeleteMap={deleteMap} />
      {/if}
    {/each}
  {:else}
    <center>Žádné mapy nenalezeny</center>
  {/if}
</div>
{#if isStoryteller}
  <center><a href={`/game/map-form?gameId=${game.id}`} class='button addMap large'>Přidat mapu</a></center>
{/if}

<style>
  center { padding: 40px }
</style>
