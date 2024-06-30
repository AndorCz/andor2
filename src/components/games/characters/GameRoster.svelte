<script>
  import { isFilledArray } from '@lib/utils'
  import Character from '@components/games/characters/Character.svelte'
  import CharacterHeader from '@components/games/characters/CharacterHeader.svelte'

  export let game = {}
  export let user = {}
  export let isStoryteller
  export let isPlayer

  const characters = { playing: [], storytellers: [] }

  game.characters.forEach((char) => {
    if (char.state === 'alive') {
      if (char.storyteller) {
        characters.storytellers.push(char)
      } else if (char.player && char.accepted) {
        characters.playing.push(char)
      }
    }
  })

  characters.storytellers.sort((a, b) => a.name.localeCompare(b.name))
  characters.playing.sort((a, b) => a.name.localeCompare(b.name))
</script>

{#if game.open_game || isStoryteller || isPlayer || game.open_chars}
  <h2>Vypravěči</h2>
  <table class='characters'>
    {#if isFilledArray(characters.storytellers)}
      <CharacterHeader {isStoryteller} />
      {#each characters.storytellers as character}
        <Character {user} {character} {isStoryteller} {game} />
      {/each}
    {:else}
      <td class='none'>Žádní vypravěči</td>
    {/if}
  </table>

  <h2>Ve hře</h2>
  <table class='characters'>
    {#if isFilledArray(characters.playing)}
      <CharacterHeader {isStoryteller} />
      {#each characters.playing as character}
        <Character {user} {character} {isStoryteller} {game} />
      {/each}
    {:else}
      <tr><td class='none'>Žádné postavy</td></tr>
    {/if}
  </table>
{:else}
  <div class='info'><span class='material'>info</span>Hra je soukromá, nemůžeš vidět její postavy</div>
{/if}

<style>
  .info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>
