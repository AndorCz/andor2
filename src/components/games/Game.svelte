<script>
  import { onMount } from 'svelte'
  import { getGameStore, bookmarks } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import Discussion from '@components/Discussion.svelte'
  import GameInfo from '@components/games/GameInfo.svelte'
  import GameThread from '@components/games/GameThread.svelte'
  import GameCharacters from '@components/games/GameCharacters.svelte'
  import GameStoryteller from '@components/games/GameStoryteller.svelte'

  export let user = {}
  export let data = {}

  // prepare store
  const gameStore = getGameStore(data.id)
  const isGameOwner = data.owner.id === user.id
  const isPlayer = data.characters.some(c => c.accepted && c.player.id === user.id)
  const isStoryteller = data.characters.some(c => c.storyteller && c.player.id === user.id)
  let bookmarkId

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlTab = urlParams.get('tab')
    $gameStore.activeTab = urlTab || $gameStore.activeTab || 'info'
    window.history.replaceState({}, document.title, window.location.pathname) // clear params
  })

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  async function addBookmark () {
    const { data: newBookmark, error } = await supabase.from('bookmarks').upsert({ user_id: user.id, game_id: data.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true }).select().maybeSingle()
    if (error) { return handleError(error) }
    if (newBookmark) {
      $bookmarks.games = [...$bookmarks.games, { id: newBookmark.id, game_id: data.id, name: data.name }]
      showSuccess('Záložka přidána')
    }
  }

  async function removeBookmark () {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) { return handleError(error) }
    $bookmarks.games = $bookmarks.games.filter(b => b.game_id !== data.id)
    showSuccess('Záložka odebrána')
  }

  $: bookmarkId = $bookmarks.games.find(b => b.game_id === data.id)?.id
</script>

<main>

  <div class='headline'>
    <h1>{data.name}</h1>
    {#if user.id}
      <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark' class:active={bookmarkId} title='Sledovat'>bookmark</button>
      {#if isGameOwner}
        <button on:click={showSettings} class='material settings' title='Nastavení'>settings</button>
      {/if}
    {/if}
  </div>

  <nav class='tabs secondary'>
    <button on:click={() => { $gameStore.activeTab = 'info' }} class={$gameStore.activeTab === 'info' ? 'active' : ''}>
      Info{#if data.unread.gameInfo && $gameStore.activeTab !== 'info'}<span class='unread badge'></span>{/if}
    </button>
    <button on:click={() => { $gameStore.activeTab = 'game' }} class={$gameStore.activeTab === 'game' ? 'active' : ''} class:hasUnread={data.unread.gameThread}>
      Hra{#if data.unread.gameThread && $gameStore.activeTab !== 'game'}<span class='unread count'>{data.unread.gameThread}</span>{/if}
    </button>
    <button on:click={() => { $gameStore.activeTab = 'chat' }} class={$gameStore.activeTab === 'chat' ? 'active' : ''} class:hasUnread={data.unread.gameChat}>
      Diskuze{#if data.unread.gameChat && $gameStore.activeTab !== 'chat'}<span class='unread count'>{data.unread.gameChat}</span>{/if}
    </button>
    <button on:click={() => { $gameStore.activeTab = 'chars' }} class={$gameStore.activeTab === 'chars' ? 'active' : ''}>
      Postavy{#if data.unread.gameCharacters && $gameStore.activeTab !== 'chars'}<span class='unread badge'></span>{/if}
    </button>
    {#if isStoryteller}
      <button on:click={() => { $gameStore.activeTab = 'story' }} class={$gameStore.activeTab === 'story' ? 'active' : ''}>
        Vypravěč
      </button>
    {/if}
  </nav>

  <div class='content'>
    {#if $gameStore.activeTab === 'info'}
      <GameInfo {data} {user} {isStoryteller} />
    {:else if $gameStore.activeTab === 'chat'}
      <Discussion {data} {user} {isGameOwner} unread={data.unread.gameChat} thread={data.discussion_thread} useIdentities isPermitted={isPlayer} identityStore={gameStore} />
    {:else if $gameStore.activeTab === 'game'}
      <GameThread {data} {user} {isStoryteller} unread={data.unread.gameThread} />
    {:else if $gameStore.activeTab === 'chars'}
      <GameCharacters {data} {user} {isGameOwner} {isStoryteller} />
    {:else if $gameStore.activeTab === 'story' && isStoryteller}
      <GameStoryteller {data} {user} {isStoryteller} />
    {/if}
  </div>
</main>

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
    h1 {
      margin: 0px;
      flex: 1;
    }
    .headline button {
      padding: 10px;
      margin-left: 10px;
    }

  main {
    position: relative;
  }

  .tabs button {
    position: relative;
  }
    .tabs button.hasUnread {
      margin-right: 10px;
    }
    .tabs .unread {
      position: absolute;
      top: 5px;
      right: 5px;
      color: var(--new);
    }
    .tabs .count {
      top: -5px;
      right: 5px;
    }

  @media (max-width: 860px) {
    .content {
      padding: 40px 10px;
    }
  }
</style>
