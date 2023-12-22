<script>
  import Character from '@components/games/Character.svelte'
  import CharacterHeader from '@components/games/CharacterHeader.svelte'

  export let user = {}
  export let data = {}
  export let isGameOwner

  // sort character categories
  const isCharPlayer = (char) => { return char.player?.id === user.id }
  const isVisible = (char) => { return !char.hidden || isCharPlayer(char) }
  const characters = { playing: [], waiting: [], open: [], storytellers: [] }

  data.characters.forEach((char) => {
    if (char.storyteller) { // storytellers
      characters.storytellers.push(char)
    } else if (char.open) { // open
      characters.open.push(char)
    } else if (char.player) {
      if (char.accepted) { // playing
        if (isVisible(char)) { characters.playing.push(char) } // don't show hidden to players
      } else { // waiting
        characters.waiting.push(char)
      }
    }
  })
</script>

<main>
  <h2>Vypravěči</h2>
  <table class='characters'>
    {#if characters.storytellers.length > 0}
      <CharacterHeader {isGameOwner} />
      {#each characters.storytellers as character}
        <Character {user} {character} {isGameOwner} />
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

  <a href='./character-form' class='button'>Vytvořit novou postavu</a>
</main>

<style>
  h2 {
    margin-top: 0px;
  }
  .characters {
    width: 100%;
    margin-bottom: 50px;
  }
  .none {
    padding-left: 20px;
    color: var(--dim);
  }
  .button {
    position: absolute;
    top: 0px;
    right: 0px;
  }
</style>
