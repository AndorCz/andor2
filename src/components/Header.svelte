<script>
  import { onMount } from 'svelte'
  import { headerPreview } from '@lib/stores'
  import { supabase } from '@lib/database-browser'
  import { initToasts, lookForToast } from '@lib/toasts'

  export let pathname
  export let headerStatic
  export let headerStorage
  export let showMenu = true
  export let chatUnread = false

  let headerUrl = headerStatic
  let errorFetchingHeader = false
  let chatPeople = 0

  async function getHeaderUrl () {
    try {
      const { data, error } = await supabase.storage.from('headers').getPublicUrl(headerStorage)
      if (error) { throw error }
      headerUrl = data.publicUrl
    } catch (error) {
      errorFetchingHeader = error
    }
  }

  onMount(() => {
    $headerPreview = null // clear preview, only used momentarily after upload
    initToasts()
    lookForToast()
    document.addEventListener('astro:page-load', () => { lookForToast() })
    // chat presence
    const chatChannel = supabase.channel('chat')
    chatChannel.on('presence', { event: 'sync' }, () => { // sync is called on every presence change
      const newState = chatChannel.presenceState()
      chatPeople = Object.keys(newState).length
    })
    chatChannel.subscribe()
  })

  $: if (headerStorage) { getHeaderUrl() }
</script>

{#if errorFetchingHeader}
  <p>Chyba při načítání hlavičky: {errorFetchingHeader.message}</p>
{:else if pathname !== '/chat'}
  <header style="--header-path: url({$headerPreview || headerUrl || '/header.jpg'})">
    <!-- svelte-ignore a11y-missing-content -->
    <a href='/' id='logo'></a>
    {#if showMenu}
      <nav class='tabs'>
        <a href='/' class={pathname === '/' ? 'active' : ''}>Novinky</a>
        <a href='/games' class={pathname.startsWith('/game') ? 'active' : ''}>Hry</a>
        <a href='/works' class={pathname.startsWith('/work') ? 'active' : ''}>Tvorba</a>
        <a href='/boards' class={pathname.startsWith('/board') ? 'active' : ''}>Diskuze</a>
        <a href='/solo' class={pathname.startsWith('/solo') ? 'active' : ''}>Sólo</a>
        <a href='/chat' class={pathname.startsWith('/chat') ? 'active' : ''}>
          <span>Chat</span>
          {#if chatPeople}({chatPeople}){/if}
          {#if chatUnread}<span class='unread badge'></span>{/if}
        </a>
      </nav>
    {/if}
  </header>
{/if}

<style>
  header {
    position: relative;
    height: 226px;
    background-image: var(--header-path);
    background-position: center right;
    background-size: cover;
  }
    #logo {
      position: absolute;
      display: block;
      top: 40px;
      left: 50px;
      width: 190px;
      height: 90px;
      background-image: url('/andor2.png');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: top;
    }
      #logo:hover {
        background-position: bottom;
      }
    nav {
      position: absolute;
      bottom: -1px;
      left: 30px;
    }
  .badge {
    top: 10px;
    right: 5px;
  }

  @media (max-width: 860px) {
    header {
      height: 150px;
      background-size: cover;
    }
      #logo {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(190px * 0.75);
        height: calc(90px * 0.75);
      }
  }

  @media (max-width: 530px) {
    nav {
      left: 0px;
      display: flex;
      justify-content: space-evenly;
      width: 100%;
    }
      nav a {
        padding: 10px 0px;
      }
      nav a.active {
        padding: 10px 15px;
      }
  }
</style>
