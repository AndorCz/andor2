<script>
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import { redirectWithToast, isFilledArray } from '@lib/utils'
  import { getSavedStore, activeConversation, bookmarks } from '@lib/stores'
  import User from '@components/sidebar/User.svelte'
  import People from '@components/sidebar/People.svelte'
  import Bookmarks from '@components/sidebar/Bookmarks.svelte'
  import Characters from '@components/sidebar/Characters.svelte'
  import Conversation from '@components/sidebar/Conversation.svelte'

  const { user = {}, pathname = '' } = $props()

  let showSidebar = $state(false)
  let loginInProgress = $state(false)

  // layout
  let scrollingRegistered = false
  let sectionTop = 0
  let heightOverflow = 0
  let lastScrollOffset = 0
  let scrollDelta = 0
  let sectionEl = $state()
  let stickTop = $state(false)
  let stickBottom = $state(false)
  let resizeObserver

  // unread
  let unreadBookmarks = $state(false)
  let unreadUsers = $state(false)
  let unreadCharacters = $state(false)

  // users
  let userStore = $state()
  let users = $state([])
  let activeUsers = $state(0)
  let email = $state('')
  let password = $state('')

  // characters
  let characters = $state({ allGrouped: [], myStranded: [] })

  // loading states
  let loading = $state(false)
  let currentTab = $state('')

  onMount(async () => {
    userStore = getSavedStore('user')
    $userStore.activePanel = $userStore.activePanel || 'booked'
    document.getElementById($userStore.activePanel)?.classList.add('active')
    window.addEventListener('resize', updateHeight) // update height on window resize
    setupResizeObserver()

    await loadUnread()
    await loadActiveUsers()
    await loadTabData($userStore.activePanel) // Load first tab data on mount
  })

  onDestroy(() => { resizeObserver.disconnect() })

  function setupResizeObserver () {
    resizeObserver = new ResizeObserver(entries => {
      entries.forEach(() => updateHeight())
    })
    if (sectionEl) { resizeObserver.observe(sectionEl) }
  }

  function updateHeight () {
    const specialLayout = ['/chat', '/solo/game'].some(path => pathname.includes(path))
    if (!specialLayout && sectionEl) {
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

  async function activate (panel) {
    if ($userStore.activePanel !== panel) {
      $userStore.activePanel = panel
      document.querySelectorAll('#tabs button').forEach(button => {
        button.classList.toggle('active', button.id === panel)
      })
      // Load data for the newly activated tab
      await loadTabData(panel)
    }
  }

  function openConversation ({ us = user, them, type = 'user' }) {
    $activeConversation = { us, them, type }
  }

  async function loadUnread () {
    const { data, error } = await supabase.rpc('get_unread_tabs')
    if (error) { throw error }
    if (data) {
      unreadBookmarks = data.unread_bookmarks > 0
      unreadUsers = data.unread_user_messages > 0
      unreadCharacters = data.unread_character_messages > 0
    }
  }

  async function loadTabData (panel) {
    if (!user.id) return // Only load data if user is logged in
    currentTab = panel
    loading = true
    try {
      if (panel === 'booked') {
        await loadBookmarksData()
      } else if (panel === 'people') {
        await loadUsersData()
      } else if (panel === 'characters') {
        await loadCharactersData()
      }
    } catch (error) {
      handleError(error)
    } finally {
      loading = false
    }
  }

  async function loadActiveUsers () {
    const { data, error } = await supabase.rpc('get_active_user_count')
    if (error) { throw error }
    activeUsers = data || 0
  }

  async function loadBookmarksData () {
    const { data, error } = await supabase.from('user_bookmarks').select().eq('user_id', user.id)
    if (error) { throw error }
    const groupedData = { solo: [], games: [], boards: [], works: [] }
    if (data) {
      data.forEach(item => {
        if (item.solo_id) {
          groupedData.solo.push({ ...item, id: item.solo_id })
        } else if (item.game_id) {
          groupedData.games.push({ ...item, id: item.game_id, unread_game: item.unread, unread_discussion: item.unread_secondary })
        } else if (item.board_id) {
          groupedData.boards.push({ ...item, id: item.board_id })
        } else if (item.work_id) {
          groupedData.works.push({ ...item, id: item.work_id })
        }
      })
      unreadBookmarks = getBookmarkUnread(groupedData)
    }
    $bookmarks = groupedData
  }

  async function loadUsersData () {
    const { data, error } = await supabase.rpc('get_user_data')
    if (error) { throw error }
    if (data) {
      users = data || []
      activeUsers = users.filter(u => u.active).length
      unreadUsers = users.some(u => u.unread)
    }
  }

  async function loadCharactersData () {
    const { data, error } = await supabase.rpc('get_character_data')
    if (error) { throw error }
    if (data) {
      characters = data || { allGrouped: [], myStranded: [] }
      unreadCharacters = characters.unreadTotal > 0
    }
  }

  function getBookmarkUnread (bookmarks) {
    let unreadFound = false
    if (bookmarks.games) {
      Object.keys(bookmarks.games).forEach(gameId => {
        unreadFound ||= bookmarks.games[gameId]?.unread_game > 0
      })
      Object.keys(bookmarks.games).forEach(gameId => {
        unreadFound ||= bookmarks.games[gameId]?.unread_discussion > 0
      })
    }
    if (bookmarks.works) {
      Object.keys(bookmarks.works).forEach(workId => {
        unreadFound ||= bookmarks.works[workId]?.unread > 0
      })
    }
    if (bookmarks.boards) {
      Object.keys(bookmarks.boards).forEach(boardId => {
        unreadFound ||= bookmarks.boards[boardId]?.unread > 0
      })
    }
    return unreadFound
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

  function clearUnreadUser (userId) {
    const user = users.find(u => u.id === userId)
    if (user) {
      user.unread = 0
      unreadUsers = users.some(u => u.unread)
    }
  }

  function clearUnreadCharacter (themId, usId) {
    const flatCharacters = characters.allGrouped.flatMap(group => group.characters)
    if (isFilledArray(flatCharacters)) {
      const character = flatCharacters.find(c => c.id === usId)
      if (character) {
        if (character.unread > 0) { character.unread-- }
        const contact = character.contacts.find(c => c.id === themId)
        if (contact) {
          contact.unread = 0
          unreadCharacters = flatCharacters.some(c => c.contacts.some(contact => contact.unread > 0))
        }
      }
    }
  }
</script>

<div id='veil' class:active={showSidebar || $activeConversation} onclick={() => { showSidebar = false }}></div>

<aside class:conversation={user.id && $activeConversation} class:active={showSidebar || $activeConversation} class:chat={pathname === '/chat'}>
  <section bind:this={sectionEl} class:stickTop={stickTop} class:stickBottom={stickBottom}>
    {#if user.name || user.email}
      {#if $activeConversation}
        <Conversation {user} clearUnread={$userStore?.activePanel === 'people' ? clearUnreadUser : clearUnreadCharacter } />
      {:else}
        <User {user} />

        {#if $userStore?.activePanel}
          <div id='tabs'>
            <button id='booked' class:active={$userStore?.activePanel === 'booked'} onclick={() => { activate('booked') }}>
              {#if unreadBookmarks && $userStore.activePanel !== 'booked'}<span class='unread badge'></span>{/if}
              <span class='material'>bookmark</span><span class='label'>Záložky</span>
            </button>
            <button id='people' class:active={$userStore?.activePanel === 'people'} onclick={() => { activate('people') }}>
              {#if unreadUsers && $userStore.activePanel !== 'people'}<span class='unread badge'></span>{/if}
              <span class='material'>person</span>
              <span class='label'>Lidé{#if activeUsers}&nbsp;({activeUsers}){/if}</span>
            </button>
            <button id='characters' class:active={$userStore?.activePanel === 'characters'} onclick={() => { activate('characters') }}>
              {#if unreadCharacters && $userStore?.activePanel !== 'characters'}<span class='unread badge'></span>{/if}
              <span class='material'>domino_mask</span>
              <span class='label'>Postavy</span>
            </button>
          </div>
        {/if}
        <div id='panels'>
          {#if loading}
            <div class='loading'>Načítání...</div>
          {:else}
            {#if currentTab === 'booked'}
              <Bookmarks />
            {:else if currentTab === 'people'}
              <People {user} {users} {openConversation} />
            {:else if currentTab === 'characters'}
              <Characters {userStore} {characters} {openConversation} />
            {/if}
          {/if}
        </div>
      {/if}
    {:else}
      <div class='login email'>
        <input type='email' class='w100' placeholder='E-mail' bind:value={email} />
        <div class='row'>
          <input type='password' placeholder='Heslo' bind:value={password} onkeydown={(event) => { if (event.key === 'Enter') signInWithEmail() }} />
          <button type='submit' class='material confirm' onclick={signInWithEmail} disabled={loginInProgress}>login</button>
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
    <button id='sidebarToggle' class='material' onclick={() => { showSidebar = !showSidebar }}>side_navigation</button>
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

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100px;
    color: var(--dim);
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
    background-color: #000B;
    transition: opacity 0.4s ease-in-out;
  }

@media (max-width: 1000px) {
  #toggleWrapper {
    display: block;
    position: sticky;
    top: calc(100svh - 90px);
    right: 10px;
    width: 0px;
    height: 0px;
    z-index: 9999;
  }
    #sidebarToggle {
      position: absolute;
      right: -20px;
      bottom: 0px;
      display: block;
      padding: 20px;
      width: 66px;
      height: 66px;
      border-radius: 100%;
      box-shadow: 4px 4px 5px #0006;
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
    z-index: 99999;
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
