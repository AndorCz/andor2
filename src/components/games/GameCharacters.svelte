<script>
  import Character from '@components/games/Character.svelte'
  import CharacterHeader from '@components/games/CharacterHeader.svelte'

  export let user = {}
  export let data = {}
  export let isGameOwner

  // sort character categories
  // const isVisible = (char) => { return !char.hidden || isCharPlayer(char) }
  const isCharPlayer = (char) => { return char.player?.id === user.id }
  const characters = { playing: [], waiting: [], open: [], storytellers: [], myWaiting: [] }

  data.characters.forEach((char) => {
    if (char.storyteller) { // storytellers
      characters.storytellers.push(char)
    } else if (char.open) { // open
      characters.open.push(char)
    } else if (char.player) {
      if (char.accepted) { // playing
        characters.playing.push(char)
      } else { // waiting
        if (isGameOwner) { // all waiting to owner
          characters.waiting.push(char)
        } else if (isCharPlayer(char)) { // only their to player
          characters.waiting.push(char)
        }
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
  <div class='note'><span class='material'>info</span>Novou postavu vidí jen vypravěči, dokud nenapíše veřejný příspěvek.</div>

  {#if isGameOwner || characters.waiting.length > 0}
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
  {/if}

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
  {#if user.id}
    <center>
      <a href={window.location.href + '/character-form'} class='button'>Vytvořit novou postavu</a>
    </center>
  {/if}
</main>

<style>
  h2 {
    margin-top: 0px;
  }
  .note {
    font-style: italic;
    padding-left: 20px;
    margin-bottom: 40px;
    color: var(--dim);
    display: flex;
  }
    .note .material {
      margin-right: 10px;
    }
  .characters {
    width: 100%;
    margin-bottom: 50px;
  }
  .none {
    padding-left: 20px;
    color: var(--dim);
  }
  center {
    margin-top: 20px;
  }
</style>
