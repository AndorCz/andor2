<script>
  import { onMount } from 'svelte'
  import { getGameStore } from '@lib/stores'
  import Discussion from '@components/Discussion.svelte'
  import GameThread from '@components/games/GameThread.svelte'
  import GameCharacters from '@components/games/GameCharacters.svelte'
  import GameInfo from '@components/games/GameInfo.svelte'
  import GameSettings from '@components/games/GameSettings.svelte'

  export let user = {}
  export let data = {}

  // prepare store
  const gameStore = getGameStore(data.id)
  const isGameOwner = data.owner.id === user.id

  onMount(() => {
    $gameStore.activeTab = $gameStore.activeTab || 'info' // set default value
    if (!isGameOwner && $gameStore.activeTab === 'set') { $gameStore.activeTab = 'info' } // if you get logged out
  })
</script>

<main>

  <h1>{data.name}</h1>

  <nav class='tabs secondary'>
    <button on:click={() => { $gameStore.activeTab = 'info' }} class={$gameStore.activeTab === 'info' ? 'active' : ''}>Info</button>
    <button on:click={() => { $gameStore.activeTab = 'chat' }} class={$gameStore.activeTab === 'chat' ? 'active' : ''}>Chat</button>
    <button on:click={() => { $gameStore.activeTab = 'game' }} class={$gameStore.activeTab === 'game' ? 'active' : ''}>Hra</button>
    <button on:click={() => { $gameStore.activeTab = 'chars' }} class={$gameStore.activeTab === 'chars' ? 'active' : ''}>Postavy</button>
    {#if isGameOwner}
      <button on:click={() => { $gameStore.activeTab = 'set' }} class={$gameStore.activeTab === 'set' ? 'active' : ''}>Nastavení</button>
    {/if}
  </nav>

  <div class='content'>
    {#if $gameStore.activeTab === 'info'}
      <GameInfo {data} {isGameOwner} />
    {:else if $gameStore.activeTab === 'chat'}
      <Discussion {data} {user} {isGameOwner} />
    {:else if $gameStore.activeTab === 'game'}
      <GameThread {data} {user} {isGameOwner} />
    {:else if $gameStore.activeTab === 'chars'}
      <GameCharacters {data} {user} {isGameOwner} />
    {:else if $gameStore.activeTab === 'set'}
      <GameSettings {data} {isGameOwner} />
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
