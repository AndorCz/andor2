<script>
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import { showSuccess } from '@lib/toasts'
  import { isFilledArray } from '@lib/utils'
  import Map from '@components/games/maps/Map.svelte'

  let { user, game = $bindable(), isStoryteller } = $props()

  game.maps?.forEach(map => {
    map.isOpen = map.isActive
    map.isActive = map.id === game.active_map?.id
  })

  game.characters?.forEach(character => {
    character.portraitUrl = character.portrait ? getPortraitUrl(character.id, character.portrait) : null
  })

  async function deleteMap (mapId) {
    if (confirm('Opravdu chcete smazat tuto mapu?')) {
      if (game.active_map?.id === mapId) {
        const { error } = await supabase.from('games').update({ active_map_id: null }).eq('id', game.id)
        if (error) { handleError(error) }
        game.active_map = null
      }
      const { error } = await supabase.from('maps').delete().eq('id', mapId)
      if (error) { handleError(error) }

      const { error: storageError } = await supabase.storage.from('maps').remove([`${game.id}/${mapId}_fow`])
      if (storageError) { handleError(storageError) }

      const { error: storageError2 } = await supabase.storage.from('maps').remove([`${game.id}/${mapId}`])
      if (storageError2) { handleError(storageError2) }

      game.maps = game.maps.filter(map => map.id !== mapId)
      showSuccess('Mapa byla smazána')
    }
  }
</script>
<div class='maps'>
  {#if isFilledArray(game.maps)}
    {#each game.maps as map}
      {#if (!map.hidden || isStoryteller)}
        <h3>
          <button onclick={() => { map.isOpen = !map.isOpen }} class='plain'>
            <span class='material arrow' class:isOpen={map.isOpen}>arrow_drop_down</span>
            <span class='name'>{#if map.hidden}<span class='material'>visibility_off</span>{/if}{map.name}</span>
          </button>
        </h3>
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
  h3 {
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
    h3 button {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 10px;
    }
    h3 button:hover {
      color: var(--buttonTxHover);
    }
    .arrow {
      transform: rotate(0deg);
      transition: transform 0.3s;
    }
      .arrow.isOpen {
        transform: rotate(180deg);
      }
</style>
