<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { getSavedStore, activeConversation, bookmarks } from '@lib/stores'
  import Characters from '@components/sidebar/Characters.svelte'
  import Bookmarks from '@components/sidebar/Bookmarks.svelte'
  import People from '@components/sidebar/People.svelte'
  import Conversation from '@components/sidebar/Conversation.svelte'
  import User from '@components/sidebar/User.svelte'

  export let user = {}

  let showSidebar = false

  // bookmarks
  let bookmarkUnreadTotal = 0

  // users
  let userStore
  let users = []
  let activeUsers = 0
  let unreadUsers = false
  let email = ''
  let password = ''

  // characters
  let characters = { allGrouped: [], myStranded: [] }
  let unreadCharacters = false

  onMount(async () => {
    userStore = getSavedStore('user')
    $userStore.activePanel = $userStore.activePanel || 'booked'
    document.getElementById($userStore.activePanel)?.classList.add('active')
  })

  function activate (panel) {
    $userStore.activePanel = panel
    document.querySelectorAll('#tabs button').forEach(button => {
      button.classList.toggle('active', button.id === panel)
    })
  }

  function openConversation ({ us = user, them, type = 'user' }) {
    $activeConversation = { us, them, type }
  }

  async function loadData () {
    const { data, error } = await supabase.rpc('get_sidebar_data').single()
    if (error) { handleError(error) }
    $bookmarks = data.bookmarks ? data.bookmarks : { games: [], boards: [], works: [] }
    users = data.users || []
    characters = data.characters || { allGrouped: [], myStranded: [] }
    // get tab information
    activeUsers = users.filter(u => u.active).length
    unreadUsers = users.some(u => u.unread)
    unreadCharacters = characters.unreadTotal > 0
  }

  function getBookmarkUnreadTotal (bookmarks) {
    let total = 0
    Object.keys(bookmarks.games).forEach(gameId => { total += bookmarks.games[gameId].unread })
    Object.keys(bookmarks.boards).forEach(boardId => { total += bookmarks.boards[boardId].unread })
    return total
  }

  async function signInWithEmail () {
    if (!email || !password) { return }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { handleError(new Error('Neplatné přihlašovací údaje')) }
    if (data.session?.access_token && data.session?.refresh_token) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=100*1000*60*60*24*365` // 100 years
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=100*1000*60*60*24*365`
      window.location.href = '/?toastType=success&toastText=' + encodeURIComponent('Přihlášení proběhlo úspěšně')
    }
  }

  $: bookmarkUnreadTotal = getBookmarkUnreadTotal($bookmarks)
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div id='veil' class:active={showSidebar} on:click={() => { showSidebar = false }}></div>
<aside style='--asideWidth: {user.id && $activeConversation ? 400 : 280}px' class:active={showSidebar}>
  <section>
    {#if user.name || user.email}
      {#if $activeConversation}
        <Conversation {user} />
      {:else}
        {#await loadData()}
          <div class='loading'>Načítání...</div>
        {:then}
          <User {user} />
          <div id='tabs'>
            <button id='booked' class:active={$userStore.activePanel === 'booked'} on:click={() => { activate('booked') }}>
              {#if bookmarkUnreadTotal && $userStore.activePanel !== 'booked'}<span class='unread badge'></span>{/if}
              <span class='material'>bookmark</span><span class='label'>Záložky</span>
            </button>
            <button id='people' class:active={$userStore.activePanel === 'people'} on:click={() => { activate('people') }}>
              {#if unreadUsers && $userStore.activePanel !== 'people'}<span class='unread badge'></span>{/if}
              <span class='material'>person</span>
              <span class='label'>Lidé{#if activeUsers}&nbsp;({activeUsers}){/if}</span>
            </button>
            <button id='characters' class:active={$userStore.activePanel === 'characters'} on:click={() => { activate('characters') }}>
              {#if unreadCharacters && $userStore.activePanel !== 'characters'}<span class='unread badge'></span>{/if}
              <span class='material'>domino_mask</span>
              <span class='label'>Postavy</span>
            </button>
          </div>
          <div id='panels'>
            {#if $userStore.activePanel === 'booked'}
              <Bookmarks />
            {:else if $userStore.activePanel === 'people'}
              <People {users} {openConversation} />
            {:else if $userStore.activePanel === 'characters'}
              <Characters {characters} {openConversation} />
            {/if}
          </div>
        {/await}
      {/if}
    {:else}
      <div class='login email'>
        <input type='email' class='w100' placeholder='E-mail' bind:value={email} />
        <div class='row'>
          <input type='password' placeholder='Heslo' bind:value={password} />
          <button type='submit' class='material confirm' on:click={signInWithEmail}>login</button>
        </div>
        <div class='row links'>
          <a href='/signup' class='register'>Registrovat</a>
          <a href='/reset'>Reset hesla</a>
        </div>
      </div>
      <div class='login google'>
        <form action='/api/auth/login' method='post' data-astro-reload><!-- data-astro-reload prevents an issue from view-transition -->
          <button value='google' name='provider' type='submit' class='google w100 large'>Přihlásit přes Google</button>
        </form>
      </div>
    {/if}
  </section>
</aside>

<button id='sidebarToggle' class='material' on:click={() => { showSidebar = !showSidebar }}>side_navigation</button>

<style>
  aside {
    width: calc(var(--asideWidth) + 20px);
    transition: right 0.2s ease-in-out, width 0.2s ease-in-out;
    position: relative;
  }
    section {
      position: fixed;
      padding-left: 20px;
      padding-right: 20px;
      padding-bottom: 50px;
      width: calc(var(--asideWidth) + 40px);
      max-height: 100svh;
      overflow-y: auto;
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

  #panels, .login {
    padding: 20px;
    border-radius: 10px;
    background-color: var(--panel);
    position: relative;
  }
    .login {
      margin-top: 20px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
    }
    .login .confirm {
      padding: 15px;
    }
    .email {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .links {
      margin-top: 10px;
    }

  .w100 {
    width: 100%;
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

@media (max-width: 1000px) {
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
    width: calc(var(--asideWidth) + 40px);
    background-color: var(--background);
    box-shadow: 0px 0px 10px #0005;
    height: 100%;
    overflow-y: auto;
    padding-bottom: 20px;
  }
    aside.active {
      right: 0px;
    }
    section {
      position: relative;
    }
  #veil.active {
    visibility: visible;
    opacity: 1;
  }
}
</style>
