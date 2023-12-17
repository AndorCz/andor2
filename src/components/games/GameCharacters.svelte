<script>
  import Character from '@components/games/Character.svelte'
  import CharacterHeader from '@components/games/CharacterHeader.svelte'

  export let isGameOwner
  export let characters
  export let user
</script>

<h2>Vypravěči</h2>
<table class='characters'>
  {#if characters.storytellers.length > 0}
    <CharacterHeader {isGameOwner} />
    {#each characters.storytellers as storyteller}
      <Character {user} {storyteller} {isGameOwner} />
    {/each}
  {:else}
    <td class='none'>Žádní vypravěči</td>
  {/if}
</table>

<h2>Ve hře</h2>
<table class='characters'>
  {#if characters.playing.length > 0}
    <CharacterHeader {isGameOwner} />
    {#each characters.playing as character}
      <Character {user} {character} {isGameOwner} />
    {/each}
  {:else}
    <tr><td class='none'>Žádné postavy</td></tr>
  {/if}
</table>

<h2>Hlásí se</h2>
<table class='characters'>
  {#if characters.waiting.length > 0}
    <CharacterHeader {isGameOwner} />
    {#each characters.waiting as character}
      <Character {user} {character} {isGameOwner} />
    {/each}
  {:else}
    <tr><td class='none'>Žádné postavy</td></tr>
  {/if}
</table>

<h2>Volné</h2>
<table class='characters'>
  {#if characters.open.length > 0}
    <CharacterHeader {isGameOwner} />
    {#each characters.open as character}
      <Character {user} {character} {isGameOwner} />
    {/each}
  {:else}
    <tr><td class='none'>Žádné postavy</td></tr>
  {/if}
</table>

<br>
<center>
  <a href='./character-form' class='button'>Vytvořit novou postavu</a>
</center>

<style>
  .characters {
    width: 100%;
    margin-bottom: 50px;
  }
  .none {
    padding-left: 20px;
    color: var(--dim);
  }
</style>