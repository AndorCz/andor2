<script>
  import { isFilledArray } from '@lib/utils'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError, getPortraitUrl } from '@lib/database'
  import Map from '@components/games/maps/Map.svelte'

  export let user
  export let game
  export let isStoryteller

  game.maps.forEach(map => {
    map.isActive = map.id === game.active_map?.id
    map.isOpen = map.isActive
  })

  game.characters.forEach(character => {
    character.portraitUrl = getPortraitUrl(character.id, character.portrait)
  })

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
      {#if (!map.hidden || isStoryteller)}
        <h2>
          <button on:click={() => { map.isOpen = !map.isOpen }} class='plain'>
            <span class='material arrow' class:isOpen={map.isOpen}>arrow_drop_down</span>
            <span class='name'>{#if map.hidden}<span class='material'>visibility_off</span>{/if}{map.name}</span>
          </button>
        </h2>
        {#if map.isOpen}
          <Map {user} {game} {map} {isStoryteller} onDeleteMap={deleteMap} />
        {/if}
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
  h2 {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
    .name {
      font-variation-settings: 'wght' 600;
      font-size: 1.5em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    h2 button {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 10px;
    }
    .arrow {
      transform: rotate(0deg);
      transition: transform 0.3s;
    }
      .arrow.isOpen {
        transform: rotate(180deg);
      }
</style>
