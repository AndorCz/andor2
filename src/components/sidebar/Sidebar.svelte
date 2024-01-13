<script>
  import { onMount } from 'svelte'
  import { logout } from '@lib/helpers'
  import { clone } from '@lib/utils'
  import { supabase, handleError, getActiveUsers, getConversations, getUnreadConversations } from '@lib/database'
  import { getUserStore, conversations, unreadConversations } from '@lib/stores'
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import Watched from '@components/sidebar/Watched.svelte'
  import People from '@components/sidebar/People.svelte'
  import Chat from '@components/sidebar/Chat.svelte'

  export let user = {}

  const userStore = getUserStore({ activePanel: 'watched' })
  let activeUsers = []
  let allRelevantUsers = {}
  let showOffline = false

  onMount(async () => {
    if ($userStore.activePanel) {
      document.getElementById($userStore.activePanel)?.classList.add('active')
    }
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
</script>

<aside style='--asideWidth: {user.id && $userStore.openChat ? 400 : 280}px'>
  {#if user.name || user.email}
    {#if $userStore.openChat}
      <Chat {user} {userStore} />
    {:else}
      {#key showOffline}
        {#await loadData()}
          <div class='loading'>Načítání...</div>
        {:then}
          <div id='user'>
            <PortraitInput identity={user} {onPortraitChange} displayWidth={70} displayHeight={100} /><br>
            <div id='details'>
              <span id='name'>{user.name || user.email}</span>
              <button on:click={logout} id='logout'>Odhlásit</button>
            </div>
          </div>
          <div id='tabs'>
            <button id='watched' class:active={$userStore.activePanel === 'watched'} on:click={() => { activate('watched') }}><span class='material'>visibility</span><span class='label'>Sledované</span></button>
            <button id='people' class:active={$userStore.activePanel === 'people'} on:click={() => { activate('people') }}>
              {#if Object.keys($unreadConversations).length}<span class='badge'></span>{/if}
              <span class='material'>person</span>
              <span class='label'>Lidé ({activeUsers.length})</span>
            </button>
            <button id='notes' disabled class:active={$userStore.activePanel === 'notes'}><span class='material'>edit</span><span class='label'>Poznámky</span></button>
          </div>
          <div id='panels'>
            {#if $userStore.activePanel === 'watched'}
              <Watched />
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
        <button value='google' name='provider' type='submit' class='google w100'>Přihlásit přes Google</button>
      </form>
    </div>
  {/if}
</aside>

<style>
  aside {
    width: var(--asideWidth);
    margin-left: 20px;
    transition: width 0.2s ease-in-out;
  }
  #user {
    padding: 20px 0px;
    display: flex;
    gap: 10px;
  }
    #details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    #name {
      flex: 1;
      display: flex;
      align-items: center;
    }
    #logout {
      padding: 10px 20px;
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
      color: var(--link);
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
</style>
