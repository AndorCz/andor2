<script>
  import { onMount } from 'svelte'
  import { clone } from '@lib/utils'
  import { supabase, handleError, getActiveUsers, getConversations, getUnreadConversations } from '@lib/database'
  import { userStore, conversations, unreadConversations, bookmarks } from '@lib/stores'
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import Bookmarks from '@components/sidebar/Bookmarks.svelte'
  import People from '@components/sidebar/People.svelte'
  import Chat from '@components/sidebar/Conversation.svelte'

  export let user = {}
  export let bookmarkData

  $userStore.activePanel = $userStore.activePanel || 'booked'

  if (bookmarkData) { $bookmarks = bookmarkData }

  let activeUsers = []
  let allRelevantUsers = {}
  let showOffline = false
  let showSidebar = false
  const unreadTotal = getUnreadTotal()

  onMount(async () => {
    document.getElementById($userStore.activePanel)?.classList.add('active')
  })

  async function onPortraitChange (portrait) {
    const { data, error } = await supabase.from('profiles').update({ portrait }).eq('id', user.id)
    if (error) { return handleError(error) }
    return data
  }

  function activate (panel) {
    $userStore.activePanel = panel
    document.querySelectorAll('#tabs button').forEach(button => {
      button.classList.toggle('active', button.id === panel)
    })
  }

  function openChat (user) {
    $userStore.openChat = user.id
  }

  async function logout () {
    // delete cookies
    document.cookie = 'sb-access-token=; Max-Age=-99999999;'
    document.cookie = 'sb-refresh-token=; Max-Age=-99999999;'

    await supabase.auth.signOut()
    window.location.href = '/api/auth/logout'
  }

  async function loadData () {
    activeUsers = await getActiveUsers(supabase)
    if (showOffline) {
      $conversations = await getConversations(supabase, user.id)
      allRelevantUsers = clone($conversations)
    } else {
      $unreadConversations = await getUnreadConversations(supabase, user.id)
      allRelevantUsers = clone($unreadConversations)
    }
    // merge activeUsers and unreadConversations into allRelevantUsers, preserving 'unread' and 'active' flags
    activeUsers.forEach(user => {
      if (allRelevantUsers[user.id]) {
        allRelevantUsers[user.id].active = true
      } else {
        user.active = true
        allRelevantUsers[user.id] = user
      }
    })
  }

  function getUnreadTotal () {
    let total = 0
    Object.keys($bookmarks.games).forEach(gameId => { total += $bookmarks.games[gameId].unread })
    Object.keys($bookmarks.boards).forEach(boardId => { total += $bookmarks.boards[boardId].unread })
    return total
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div id='veil' class:active={showSidebar} on:click={() => { showSidebar = false }}></div>
<aside style='--asideWidth: {user.id && $userStore.openChat ? 400 : 280}px' class:active={showSidebar}>
  <content>
    {#if user.name || user.email}
      {#if $userStore.openChat}
        <Chat {user} {userStore} />
      {:else}
        {#key showOffline}
          {#await loadData()}
            <div class='loading'>Načítání...</div>
          {:then}
            <div id='user'>
              <PortraitInput identity={user} table='profiles' {onPortraitChange} displayWidth={70} displayHeight={100} /><br>
              <div id='details'>
                <div id='nameRow'>
                  <span id='name'>{user.name || user.email}</span>
                </div>
                <div>
                  <button on:click={logout} id='logout' class='material' title='odhlásit'>logout</button>
                </div>
              </div>
            </div>
            <div id='tabs'>
              <button id='booked' class:active={$userStore.activePanel === 'booked'} on:click={() => { activate('booked') }}>
                {#if unreadTotal}<span class='unread badge'></span>{/if}
                <span class='material'>bookmark</span><span class='label'>Záložky</span>
              </button>
              <button id='people' class:active={$userStore.activePanel === 'people'} on:click={() => { activate('people') }}>
                {#if Object.keys($unreadConversations).length}<span class='badge'></span>{/if}
                <span class='material'>person</span>
                <span class='label'>Lidé{#if activeUsers.length}&nbsp;({activeUsers.length}){/if}</span>
              </button>
              <button id='characters' disabled>
                <span class='material'>domino_mask</span>
                <span class='label'>Postavy</span>
              </button>
            </div>
            <div id='panels'>
              {#if $userStore.activePanel === 'booked'}
                <Bookmarks />
              {:else if $userStore.activePanel === 'people'}
                <People {allRelevantUsers} {openChat} numberOnline={activeUsers.length} bind:showOffline={showOffline} />
              {/if}
            </div>
          {/await}
        {/key}
      {/if}
    {:else}
      <div id='panels' class='login'>
        <form action='/api/auth/login' method='post' data-astro-reload><!-- data-astro-reload prevents an issue from view-transition -->
          <button value='google' name='provider' type='submit' class='google w100 large'>Přihlásit přes Google</button>
        </form>
      </div>
    {/if}
  </content>
</aside>

<button id='sidebarToggle' class='material' on:click={() => { showSidebar = !showSidebar }}>side_navigation</button>

<style>
  aside {
    width: var(--asideWidth);
    transition: right 0.2s ease-in-out, width 0.2s ease-in-out;
    position: relative;
  }
    content {
      padding-left: 20px;
      padding-right: 20px;
      position: fixed;
      top: 0px;
      right: 0px;
      width: calc(var(--asideWidth) + 20px);
      max-height: 100svh;
      overflow-y: auto;
    }
  #user {
    padding: 20px 0px;
    display: flex;
    gap: 10px;
  }
    #details {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #nameRow {
      flex: 1;
      display: flex;
      align-items: center;
    }
      #name {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    #logout {
      padding: 0px;
      padding: 5px;
    }
  #tabs {
    height: 76px;
    display: flex;
  }
    #tabs button {
      position: relative;
      flex: 1;
      display: flex;
      gap: 10px;
      color: var(--linkVisited);
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 15px 0px;
      background: none;
      border: 0px;
      margin-bottom: -10px;
      border-radius: 10px 10px 0px 0px;
      box-shadow: none;
    }
      #tabs button:hover {
        color: var(--text);
      }
    #tabs button.active {
      background: var(--panel);
      color: var(--text);
      pointer-events: none;
    }
    #tabs button .label {
      font-size: 14px;
      font-weight: 500;
    }
      .badge {
        top: 10px;
        right: 10px;
      }
      .unread {
        color: var(--new);
      }

  #panels {
    padding: 20px;
    border-radius: 10px;
    background-color: var(--panel);
  }
  .w100 {
    width: 100%;
  }
  .login {
    margin-top: 20px;
  }

  /* mobile elements */
  #sidebarToggle {
    display: none;
  }
  #veil {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    opacity: 0;
    visibility: hidden;
    background-color: #0005;
    transition: opacity 0.4s ease-in-out;
  }

@media (max-width: 860px) {
  #sidebarToggle {
    display: block;
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 20px;
    width: 66px;
    height: 66px;
    border-radius: 100%;
    box-shadow: 2px 2px 5px #0005;
  }
  aside {
    position: fixed;
    right: -100%;
    padding: 0px 20px;
    background-color: var(--background);
    box-shadow: 0px 0px 10px #0005;
    height: 100%;
    overflow-y: auto;
    padding-bottom: 20px;
  }
    aside.active {
      right: 0px;
    }
  #veil.active {
    visibility: visible;
    opacity: 1;
  }
}
</style>
