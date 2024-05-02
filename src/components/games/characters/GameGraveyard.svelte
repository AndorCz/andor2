<script>
  import { isFilledArray } from '@lib/utils'
  import Character from '@components/games/characters/Character.svelte'
  import CharacterHeader from '@components/games/characters/CharacterHeader.svelte'

  export let user = {}
  export let game = {}
  export let isStoryteller
  export let isPlayer

  // sort character categories
  const characters = { deadOnes: [] }

  game.characters.forEach((char) => {
    if (char.state == 'dead') {
      characters.deadOnes.push(char)
    }
  })

</script>

<main>
  {#if isStoryteller }
    <h2>Hřbitov</h2>
    <table class='characters'>
      {#if isFilledArray(characters.deadOnes)}
        <CharacterHeader {isStoryteller} />
        {#each characters.deadOnes as character}
          <Character {user} {character} {isStoryteller} {game} />
        {/each}
      {:else}
        <tr><td class='none'>Žádné mrtvé postavy</td></tr>
      {/if}
    </table>
    <hr>
  {:else}
    <center><div class='note'><span class='material'>info</span>Tady nemáš co dělat</div></center>
  {/if}

</main>

<style>
  main {
    padding-top: 40px;
  }
  hr {
    height: 10px;
    background-color: var(--background);
    border: none;
    margin: 60px -60px;
  }
  h2 {
    margin-top: 0px;
  }
  center {
    display: flex;
    padding-top: 20px;
    justify-content: center;
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
  .info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .row {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
    gap: 40px;
  }
  .existing {
    flex: 1;
    display: flex;
    gap: 10px;
  }
    .existing select {
      flex: 1;
    }
    .empty {
      opacity: 0.5;
    }
</style>
