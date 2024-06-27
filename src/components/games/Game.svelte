<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import { removeURLParam, isFilledArray, addCharacterNameStyles } from '@lib/utils'
  import { getSavedStore, bookmarks } from '@lib/stores'
  import { supabase, handleError } from '@lib/database-browser'
  import Discussion from '@components/Discussion.svelte'
  import GameCodex from '@components/games/codex/GameCodex.svelte'
  import GameThread from '@components/games/GameThread.svelte'
  import GameStoryteller from '@components/games/GameStoryteller.svelte'
  import GameCharacters from '@components/games/characters/GameCharacters.svelte'

  export let user = {}
  export let game = {}
  game.characters = game.characters || []
  game.unread = game.unread || {}

  const gameStore = getSavedStore('game-' + game.id)
  const isGameOwner = game.owner.id === user.id
  const isPlayer = game.characters.some(c => c.accepted && c.player.id === user.id)
  const isStoryteller = game.characters.some(c => c.storyteller && c.player.id === user.id)
  // let notificationEnabled = game.subscription?.notification || false
  let emailEnabled = game.subscription?.email || false
  let bookmarkId

  onMount(() => {
    // tabs are persisted for the purpose of saving with redirect (to astro)
    $gameStore.activeTab = new URLSearchParams(window.location.search).get('tab') || $gameStore.activeTab || 'codex'
    removeURLParam('tab')
    addCharacterNameStyles(game.characters)
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

  function changeTab (tab) {
    $gameStore.activeTab = tab
    history.pushState({}, '', `?tab=${tab}`)
  }

  /*
  async function toggleNotification () {
    notificationEnabled = !notificationEnabled
    const { error } = await supabase.from('subscriptions').upsert({ user_id: user.id, game: game.id, notification: notificationEnabled }, { onConflict: 'user_id, game', ignoreDuplicates: false })
    if (error) { return handleError(error) }
    showSuccess(notificationEnabled ? 'Notifikace zapnuty' : 'Notifikace vypnuty')
  }
  */

  async function toggleEmail () {
    emailEnabled = !emailEnabled
    const { error } = await supabase.from('subscriptions').upsert({ user_id: user.id, game: game.id, email: emailEnabled }, { onConflict: 'user_id, game', ignoreDuplicates: false })
    if (error) { return handleError(error) }
    showSuccess(emailEnabled ? 'E-maily zapnuty' : 'E-maily vypnuty')
  }

  $: bookmarkId = $bookmarks.games.find(b => b.id === game.id)?.bookmark_id
</script>

<svelte:head>
  {#if isFilledArray(game.fonts)}
    <link rel='stylesheet' href={`https://fonts.googleapis.com/css2?family=${game.fonts.join('&family=')}&display=swap`}>
  {/if}
</svelte:head>

<main>
  <div class='headline'>
    <h1>{game.name}{#if game.archived}&nbsp;(archiv){/if}</h1>
    {#if user.id}
      {#key bookmarkId}
        <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark square' class:active={bookmarkId} title={bookmarkId ? 'Odebrat záložku' : 'Sledovat'} use:tooltip>{bookmarkId ? 'bookmark_remove' : 'bookmark'}</button>
      {/key}
      <!--
      {#key notificationEnabled}
        <button on:click={toggleNotification} class='material square' class:active={notificationEnabled} title={notificationEnabled ? 'Zrušit notifikace' : 'Dostávat notifikace'} use:tooltip>{notificationEnabled ? 'notifications_off' : 'notifications'}</button>
      {/key}
      -->
      {#if isPlayer}
        {#key emailEnabled}
          <button on:click={toggleEmail} class='material square' class:active={emailEnabled} title={emailEnabled ? 'Zrušit e-maily' : 'Dostávat e-mailem nové příspěvky'} use:tooltip>{emailEnabled ? 'mail_off' : 'email'}</button>
        {/key}
      {/if}
      {#if isGameOwner}
        <button on:click={showSettings} class='material settings square' title='Nastavení hry' use:tooltip>settings</button>
      {/if}
    {/if}
  </div>

  <nav class='tabs secondary'>
    <button on:click={() => { changeTab('codex') }} class={$gameStore.activeTab === 'codex' ? 'active' : ''}>
      Kodex
    </button>
    <button on:click={() => { changeTab('game') }} class={$gameStore.activeTab === 'game' ? 'active' : ''} class:hasUnread={game.unread.gameThread}>
      Hra{#if game.unread.gameThread && $gameStore.activeTab !== 'game'}<span class='unread count'>{game.unread.gameThread}</span>{/if}
    </button>
    <button on:click={() => { changeTab('chat') }} class={$gameStore.activeTab === 'chat' ? 'active' : ''} class:hasUnread={game.unread.gameChat}>
      Diskuze{#if game.unread.gameChat && $gameStore.activeTab !== 'chat'}<span class='unread count'>{game.unread.gameChat}</span>{/if}
    </button>
    <button on:click={() => { changeTab('chars') }} class={$gameStore.activeTab === 'chars' ? 'active' : ''}>
      Postavy{#if game.unread.gameCharacters && $gameStore.activeTab !== 'chars'}<span class='unread badge'></span>{/if}
    </button>
    {#if isStoryteller}
      <button on:click={() => { changeTab('story') }} class={$gameStore.activeTab === 'story' ? 'active' : ''}>
        Vypravěč
      </button>
    {/if}
  </nav>

  <div class='content'>
    {#if $gameStore.activeTab === 'codex'}
      <GameCodex {game} {user} {isStoryteller} {isPlayer} />
    {:else if $gameStore.activeTab === 'chat'}
      {#if game.open_discussion}<h2>Veřejná diskuze</h2>{/if}
      <Discussion data={game} {user} canModerate={isStoryteller} unread={game.unread.gameChat} thread={game.discussion_thread} useIdentities isPermitted={isPlayer} slug={'game-discussion-' + game.id} contentSection={'games'} />
    {:else if $gameStore.activeTab === 'game'}
      <GameThread {game} {user} {isStoryteller} {isPlayer} unread={game.unread.gameThread} {gameStore} />
    {:else if $gameStore.activeTab === 'chars'}
      <GameCharacters {game} {user} {isStoryteller} {isPlayer} />
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
    padding-bottom: 20px;
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

  @media (max-width: 1200px) {
    .headline {
      margin-top: 20px;
    }
  }

  @media (max-width: 860px) {
    .content {
      padding: 10px;
    }
  }

  @media (max-width: 500px) {
    .content {
      padding: 10px 0px;
    }
  }
</style>
