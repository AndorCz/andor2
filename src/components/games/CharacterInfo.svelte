<script>
  import { getPortrait } from '@lib/database'

  export let isStoryteller
  export let character = {}
</script>

{#if isStoryteller}
  <main>
    <aside>
      {#if character.portrait}
        {#await getPortrait(character.id, character.portrait) then url}<img src={url} class='portrait' alt={character.name} />{/await}
      {/if}
    </aside>

    <div class='wide'>
      <h1>{character.name}</h1>

      <h2>Vzhled</h2>
      <p>{character.appearance}</p>

      <h2>Životopis</h2>
      <p>{character.bio}</p>
    </div>
  </main>
{:else}
  <p>Jen vypravěč může vidět podrobnosti o postavě</p>
{/if}

<style>
  main {
    display: flex;
    gap: 40px;
  }
    .portrait {
      margin-top: 30px;
      border-radius: 10px;
    }
  .wide {
    flex: 1;
  }
</style>
