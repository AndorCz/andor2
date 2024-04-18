<script>
  import { onMount } from 'svelte'
  import { showSuccess } from '@lib/toasts'
  import { removeURLParam } from '@lib/utils'
  import { getSavedStore, bookmarks } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import Discussion from '@components/Discussion.svelte'
  import GameCodex from '@components/games/codex/GameCodex.svelte'
  import GameThread from '@components/games/GameThread.svelte'
  import GameStoryteller from '@components/games/GameStoryteller.svelte'
  import GameCharacters from '@components/games/characters/GameCharacters.svelte'

  export let user = {}
  export let game = {}

  let bookmarkId
  const gameStore = getSavedStore('game-' + game.id)
  const isGameOwner = game.owner.id === user.id
  const isPlayer = game.characters.some(c => c.accepted && c.player.id === user.id)
  const isStoryteller = game.characters.some(c => c.storyteller && c.player.id === user.id)

  onMount(() => {
    $gameStore.activeTab = new URLSearchParams(window.location.search).get('tab') || $gameStore.activeTab || 'codex'
    removeURLParam('tab')
  })

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  async function addBookmark () {
    const { data: newBookmark, error } = await supabase.from('bookmarks').upsert({ user_id: user.id, game_id: game.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true }).select().maybeSingle()
    if (error) { return handleError(error) }
    if (newBookmark) {
      $bookmarks.games = [...$bookmarks.games, { bookmark_id: newBookmark.id, id: game.id, name: game.name }]
      showSuccess('Záložka přidána')
    }
  }

  async function removeBookmark () {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) { return handleError(error) }
    $bookmarks.games = $bookmarks.games.filter(b => b.id !== game.id)
    showSuccess('Záložka odebrána')
  }

  $: bookmarkId = $bookmarks.games.find(b => b.id === game.id)?.bookmark_id
</script>

<main>
  <div class='headline'>
    <h1>{game.name}</h1>
    {#if user.id}
      <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark square' class:active={bookmarkId} title='Sledovat'>bookmark</button>
      {#if isGameOwner}
        <button on:click={showSettings} class='material settings square' title='Nastavení'>settings</button>
      {/if}
    {/if}
  </div>

  <nav class='tabs secondary'>
    <button on:click={() => { $gameStore.activeTab = 'codex' }} class={$gameStore.activeTab === 'codex' ? 'active' : ''}>
      Kodex
    </button>
    <button on:click={() => { $gameStore.activeTab = 'game' }} class={$gameStore.activeTab === 'game' ? 'active' : ''} class:hasUnread={game.unread.gameThread}>
      Hra{#if game.unread.gameThread && $gameStore.activeTab !== 'game'}<span class='unread count'>{game.unread.gameThread}</span>{/if}
    </button>
    <button on:click={() => { $gameStore.activeTab = 'chat' }} class={$gameStore.activeTab === 'chat' ? 'active' : ''} class:hasUnread={game.unread.gameChat}>
      Diskuze{#if game.unread.gameChat && $gameStore.activeTab !== 'chat'}<span class='unread count'>{game.unread.gameChat}</span>{/if}
    </button>
    <button on:click={() => { $gameStore.activeTab = 'chars' }} class={$gameStore.activeTab === 'chars' ? 'active' : ''}>
      Postavy{#if game.unread.gameCharacters && $gameStore.activeTab !== 'chars'}<span class='unread badge'></span>{/if}
    </button>
    {#if isStoryteller}
      <button on:click={() => { $gameStore.activeTab = 'story' }} class={$gameStore.activeTab === 'story' ? 'active' : ''}>
        Vypravěč
      </button>
    {/if}
  </nav>

  <div class='content'>
    {#if $gameStore.activeTab === 'codex'}
      <GameCodex {game} {user} {isStoryteller} {isPlayer} />
    {:else if $gameStore.activeTab === 'chat'}
      <h2>{#if game.open_discussion}Veřejná diskuze{:else}Soukromá diskuze{/if}</h2>
      <Discussion data={game} {user} isOwner={isStoryteller} unread={game.unread.gameChat} thread={game.discussion_thread} useIdentities isPermitted={isPlayer} slug={'game-discussion-' + game.id} contentSection={'games'} />
    {:else if $gameStore.activeTab === 'game'}
      <GameThread {game} {user} {isStoryteller} unread={game.unread.gameThread} {gameStore} />
    {:else if $gameStore.activeTab === 'chars'}
      <GameCharacters {game} {user} {isStoryteller} />
    {:else if $gameStore.activeTab === 'story' && isStoryteller}
      <GameStoryteller {game} {user} {isStoryteller} />
    {/if}
  </div>
</main>

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 10px;
  }
    h1 {
      margin: 0px;
      flex: 1;
    }
    h2 {
      margin-top: 40px;
      margin-bottom: 0px;
    }
   .headline button {
      margin-left: 10px;
    }

  main {
    position: relative;
  }

  .secondary {
    display: flex;
  }
    .secondary button {
      position: relative;
    }
      .secondary button.hasUnread {
        margin-right: 10px;
      }
      .secondary .unread {
        position: absolute;
        top: 5px;
        right: 5px;
        color: var(--new);
      }
      .secondary .count {
        top: -5px;
        right: 5px;
      }

  @media (max-width: 860px) {
    .content {
      padding: 10px;
    }
  }
</style>
