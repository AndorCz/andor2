<script>
  import { onMount } from 'svelte'
  import { getGameStore } from '@lib/stores'
  import Discussion from '@components/Discussion.svelte'
  import GameThread from '@components/games/GameThread.svelte'
  import GameCharacters from '@components/games/GameCharacters.svelte'
  import GameInfo from '@components/games/GameInfo.svelte'

  export let user
  export let data = {}

  // prepare store
  const gameStore = getGameStore(data.id)
  const isGameOwner = data.owner.id === user.id

  // sort characters
  const isCharPlayer = (char) => { return char.player?.id === user.id }
  const isVisible = (char) => { return !char.hidden || isCharPlayer(char) }
  const characters = { playing: [], waiting: [], open: [], myPlaying: [], storytellers: [] }

  onMount(() => {
    $gameStore.activeTab = $gameStore.activeTab || 'info' // set default value
    if (!isGameOwner && $gameStore.activeTab === 'chars') { $gameStore.activeTab = 'info' } // if you get logged out
  })

  data.characters.forEach((char) => {
    if (isCharPlayer(char)) { characters.myPlaying.push(char) } // mine
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
    char.type = 'character'
  })
  data.characters = characters
  data.identities = [{ name: user.name, id: user.id, type: 'user' }, ...characters.myPlaying]
</script>

<main>

  <h1>{data.name}</h1>

  <nav class='tabs secondary'>
    <button on:click={() => { $gameStore.activeTab = 'info' }} class={$gameStore.activeTab === 'info' ? 'active' : ''}>Info</button>
    <button on:click={() => { $gameStore.activeTab = 'chat' }} class={$gameStore.activeTab === 'chat' ? 'active' : ''}>Chat</button>
    <button on:click={() => { $gameStore.activeTab = 'game' }} class={$gameStore.activeTab === 'game' ? 'active' : ''}>Hra</button>
    {#if isGameOwner} <!-- only for the owner, for now -->
      <button on:click={() => { $gameStore.activeTab = 'chars' }} class={$gameStore.activeTab === 'chars' ? 'active' : ''}>Postavy</button>
    {/if}
  </nav>

  <div class='content'>
    {#if $gameStore.activeTab === 'info'}
      <GameInfo {data} {isGameOwner} />
    {:else if $gameStore.activeTab === 'chat'}
      <Discussion {data} {isGameOwner} />
    {:else if $gameStore.activeTab === 'game'}
      <GameThread {data} {isGameOwner} />
    {:else if $gameStore.activeTab === 'chars'}
      <GameCharacters {characters} {user} {isGameOwner} />
    {/if}
  </div>
</main>

<style>
  main {
    position: relative;
  }
    .content {
      padding: 40px;
    }
</style>
