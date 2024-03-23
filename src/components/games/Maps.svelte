<script>
  export let data
  export let isStoryteller
</script>

<div class='maps'>
  {#if data.maps.length === 0}
    <p>Žádné mapy nenalezeny</p>
  {:else}
    {#each data.maps as map}
      <div class="map">
        <h2>{map.name}</h2>
      </div>
    {/each}
  {/if}
  {#if isStoryteller}
    <button>Přidat mapu</button>
  {/if}
</div>
