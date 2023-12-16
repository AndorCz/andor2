<script>
  import Character from '@components/games/Character.svelte'

  export let isGameOwner
  export let characters
  export let user
</script>

<h2>Ve hře</h2>
<ul class='characters'>
  {#each characters.playing as character}
    <Character {user} {character} {isGameOwner} />
  {:else}
    <li>Žádné postavy</li>
  {/each}
</ul>

<h2>Hlásí se</h2>
<ul class='characters'>
  {#each characters.waiting as character}
    <Character {user} {character} {isGameOwner} />
  {:else}
    <li>Žádné postavy</li>
  {/each}
</ul>

<h2>Volné</h2>
<ul class='characters'>
  {#each characters.open as character}
    <Character {user} {character} {isGameOwner} />
  {:else}
    <li>Žádné postavy</li>
  {/each}
</ul>

<br>
<center>
  <a href='./character-form' class='button'>Vytvořit novou postavu</a>
</center>

<style>
  .characters {
    padding: 0px;
  }
    .characters li {
      margin-left: 40px;
    }
</style>