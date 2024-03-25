<script>
  import { onMount } from 'svelte'
  import { getImage } from '@lib/database'

  export let game
  export let isStoryteller

  let activeMapUrl

  onMount(async () => {
    if (game.active_map) {
      activeMapUrl = await getImage(`${game.id}/${game.active_map.id}`, 'maps')
    }
  })
</script>

<div class='maps'>
  {#if game.maps.length === 0}
    <center>Žádné mapy nenalezeny</center>
  {:else}
    {#if game.active_map}
      <h2>{game.active_map.name}</h2>
      <img src={activeMapUrl} alt={game.active_map.name} />
      {#if game.active_map.description}<p>{game.active_map.description}</p>{/if}
    {/if}
    <div class='mapList'>
      {#each game.maps as map}
        <div class='map'>
          <h2>{map.name}</h2>
        </div>
      {/each}
    </div>
  {/if}
  {#if isStoryteller}
    <a href={`/game/map-form?gameId=${game.id}`} class='button'>Přidat mapu</a>
  {/if}
</div>

<style>
  center {
    padding: 20px;
  }
</style>
