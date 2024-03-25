<script>
  export let game
  export let isStoryteller
</script>

<div class='maps'>
  {#if game.maps.length === 0}
    <p>Žádné mapy nenalezeny</p>
  {:else}
    {#each game.maps as map}
      <div class="map">
        <h2>{map.name}</h2>
      </div>
    {/each}
  {/if}
  {#if isStoryteller}
    <a href={`/game/map-form?gameId=${game.id}`} class='button'>Přidat mapu</a>
  {/if}
</div>
