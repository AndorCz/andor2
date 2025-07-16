<script>
  import { isFilledArray } from '@lib/utils'
  import Character from '@components/games/characters/Character.svelte'
  import CharacterHeader from '@components/games/characters/CharacterHeader.svelte'

  const { user = {}, game = {}, isStoryteller } = $props()

  const characters = { dead: [] }

  game.characters.forEach((char) => {
    if (char.state === 'dead') {
      characters.dead.push(char)
    }
  })

</script>

<main>
  {#if isStoryteller}
    <table class='characters'>
        {#if isFilledArray(characters.dead)}
          <CharacterHeader {isStoryteller} />
          {#each characters.dead as character}
            <Character {user} {character} {isStoryteller} {game} />
          {/each}
        {:else}
        <tbody><tr><td class='none'>Žádné mrtvé postavy</td></tr></tbody>
      {/if}
    </table>
  {:else}
    <center><div class='note'><span class='material'>info</span>Tato sekce je jen pro vypravěče</div></center>
  {/if}
</main>

<style>
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
</style>
