<script>
  import { onMount, onDestroy } from 'svelte'
  import { redirectWithToast } from '@lib/utils'
  import { supabase, handleError } from '@lib/database-browser'
  import { getSavedStore, activeConversation, bookmarks } from '@lib/stores'
  import Characters from '@components/sidebar/Characters.svelte'
  import Bookmarks from '@components/sidebar/Bookmarks.svelte'
  import People from '@components/sidebar/People.svelte'
  import Conversation from '@components/sidebar/Conversation.svelte'
  import User from '@components/sidebar/User.svelte'

  export let user = {}
  export let pathname = ''

  let showSidebar = false
  let loginInProgress = false

  // layout
  let scrollingRegistered = false
  let sectionTop = 0
  let heightOverflow = 0
  let lastScrollOffset = 0
  let scrollDelta = 0
  let sectionEl
  let stickTop = false
  let stickBottom = false
  let resizeObserver

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
    window.addEventListener('resize', updateHeight) // update height on window resize
    setupResizeObserver()
  })

  onDestroy(() => { resizeObserver.disconnect() })

  // afterUpdate(async () => {
  //   await tick() // wait for DOM update
  //   updateHeight()
  // })

  function setupResizeObserver () {
    resizeObserver = new ResizeObserver(entries => {
      entries.forEach(() => updateHeight())
    })
    if (sectionEl) { resizeObserver.observe(sectionEl) }
  }

  function updateHeight () {
    if (pathname !== '/chat' && sectionEl) {
      heightOverflow = sectionEl.getBoundingClientRect().height - window.innerHeight
      if (heightOverflow > 0) {
        addDynamicScroll()
      } else {
        removeDynamicScroll()
      }
    }
  }

  function addDynamicScroll () {
    if (!scrollingRegistered) {
      window.addEventListener('scroll', dynamicScroll)
      scrollingRegistered = true
    }
  }

  function removeDynamicScroll () {
    stickTop = true
    if (scrollingRegistered) {
      sectionEl.style.top = 'initial'
      stickBottom = false
      window.removeEventListener('scroll', dynamicScroll)
      scrollingRegistered = false
    }
  }

  function dynamicScroll () {
    if (sectionEl) {
      sectionTop = window.pageYOffset + sectionEl.getBoundingClientRect().top
      scrollDelta = window.pageYOffset - lastScrollOffset

      if (scrollDelta > 0) { // Scrolling down
        // Clear stickTop
        if (stickTop) {
          stickTop = false
          sectionEl.style.top = sectionTop + 'px'
        } else if (window.pageYOffset > sectionTop + heightOverflow) {
          sectionEl.style.top = 'initial'
          stickBottom = true
        }
      }
      if (scrollDelta < 0) { // Scrolling up
        // Clear stickBottom
        if (stickBottom) {
          stickBottom = false
          sectionEl.style.top = window.pageYOffset - heightOverflow + 'px'
        } else if (window.pageYOffset < sectionTop) {
          sectionEl.style.top = 0
          stickTop = true
        }
      }
      lastScrollOffset = window.pageYOffset
    }
  }

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
    if (error) { throw error }
    if (data) {
      $bookmarks = data.bookmarks ? data.bookmarks : { games: [], boards: [], works: [] }
      users = data.users || []
      characters = data.characters || { allGrouped: [], myStranded: [] }

      // get tab information
      activeUsers = users.filter(u => u.active).length
      unreadUsers = users.some(u => u.unread)
      unreadCharacters = characters.unreadTotal > 0
    }
  }

  function getBookmarkUnreadTotal (bookmarks) {
    let total = 0
    Object.keys(bookmarks.games).forEach(gameId => { total += bookmarks.games[gameId].unread_game })
    Object.keys(bookmarks.games).forEach(gameId => { total += bookmarks.games[gameId].unread_discussion })
    Object.keys(bookmarks.boards).forEach(boardId => { total += bookmarks.boards[boardId].unread })
    return total
  }

  async function signInWithEmail () {
    if (!email || !password) { return }
    loginInProgress = true
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      handleError(new Error('Nesprávné přihlašovací údaje. Pokud máš účet na Andor.cz, nejprve klikni na "Registrovat" a připoj si účet.'))
    }
    if (data.session?.access_token && data.session?.refresh_token) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=100*1000*60*60*24*365` // 100 years
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=100*1000*60*60*24*365`
      redirectWithToast({ toastType: 'success', toastText: 'Přihlášení proběhlo úspěšně' })
    }
    loginInProgress = false
  }

  $: bookmarkUnreadTotal = getBookmarkUnreadTotal($bookmarks)
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div id='veil' class:active={showSidebar || $activeConversation} on:click={() => { showSidebar = false }}></div>

<aside class:conversation={user.id && $activeConversation} class:active={showSidebar || $activeConversation} class:chat={pathname === '/chat'}>
  <section bind:this={sectionEl} class:stickTop={stickTop} class:stickBottom={stickBottom}>
    {#if user.name || user.email}
      {#if $activeConversation}
        <Conversation {user} />
      {:else}
        <User {user} />

        {#if $userStore?.activePanel}
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
        {/if}
        <div id='panels'>
          {#await loadData()}
            <div class='loading'>Načítání...</div>
          {:then}
            {#if $userStore.activePanel === 'booked'}
              <Bookmarks />
            {:else if $userStore.activePanel === 'people'}
              <People {users} {openConversation} />
            {:else if $userStore.activePanel === 'characters'}
              <Characters {userStore} {characters} {openConversation} />
            {/if}
          {:catch error}
            <p>Chyba načítání panelu: {error.message}</p>
          {/await}
        </div>
      {/if}
    {:else}
      <div class='login email'>
        <input type='email' class='w100' placeholder='E-mail' bind:value={email} />
        <div class='row'>
          <input type='password' placeholder='Heslo' bind:value={password} on:keydown={(event) => { if (event.key === 'Enter') signInWithEmail() }} />
          <button type='submit' class='material confirm' on:click={signInWithEmail} disabled={loginInProgress}>login</button>
        </div>
        <div class='row links'>
          <a href='/signup' class='register'>Registrovat</a>
          <a href='/reset'>Reset hesla</a>
        </div>
      </div>
      <div class='login google'>
        <form action='/api/auth/login' method='post' data-astro-reload><!-- data-astro-reload prevents an issue from view-transition -->
          <button value='google' name='provider' type='submit' class='google w100 large' disabled={loginInProgress}>Přihlásit přes Google</button>
        </form>
      </div>
    {/if}
  </section>
</aside>

{#if !$activeConversation}
  <div id='toggleWrapper'>
    <button id='sidebarToggle' class='material' on:click={() => { showSidebar = !showSidebar }}>side_navigation</button>
  </div>
{/if}

<style>
  aside {
    z-index: 999;
    width: 300px;
    transition: right 0.2s ease-in-out, width 0.2s ease-in-out;
  }
    aside.conversation {
      width: 420px;
    }
    aside.chat {
      height: fit-content;
    }
    section {
      position: absolute;
      width: 300px;
      padding-left: 20px;
      padding-bottom: 20px;
    }
      /* chat only */
      aside.chat section {
        max-height: 100svh;
        overflow-y: auto;
        scrollbar-width: none;
      }
      /* conversation only */
      aside.conversation section {
        width: 420px;
        max-width: 100vw;
      }

      section.stickBottom {
        position: fixed;
        bottom: 0px;
      }
      section.stickTop {
        position: fixed;
        top: 0px;
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
  #toggleWrapper, #sidebarToggle {
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
  #toggleWrapper {
    display: block;
    position: sticky;
    top: calc(100svh - 10px);
    right: 20px;
    width: 0px;
    height: 0px;
    z-index: 9999;
  }
    #sidebarToggle {
      position: absolute;
      right: 0px;
      bottom: 0px;
      display: block;
      padding: 20px;
      width: 66px;
      height: 66px;
      border-radius: 100%;
      box-shadow: 2px 2px 5px #0005;
    }
      #sidebarToggle:hover {
        background-color: var(--buttonBgHover);
      }

  aside {
    position: sticky;
    top: 0px;
    right: 0px;
    width: 0px;
    height: 0px;
  }
    aside.conversation {
      width: 0px;
    }
    aside.active section {
      transform: translateX(0px);
    }
    aside section {
      position: absolute !important;
      top: 0px;
      right: 0px;
      width: 320px;
      padding-right: 20px;
      background-color: var(--background);
      box-shadow: 0px 0px 10px #0005;
      height: 100svh;
      overflow-y: auto;
      transform: translateX(320px);
      transition: transform 0.2s ease-in-out;
    }
  #veil.active {
    visibility: visible;
    opacity: 1;
  }
}
@media (max-width: 420px) {
  aside.conversation section {
    width: 100vw;
  }
}
</style>
