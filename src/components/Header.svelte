<script>
  import { onMount } from 'svelte'
  import { headerPreview } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'

  export let pathname
  export let headerStatic
  export let headerStorageId

  let headerUrl = headerStatic

  onMount(async () => {
    if (headerStorageId) {
      const { data, error } = await supabase.storage.from('headers').download(headerStorageId)
      if (error) { return handleError(error) }
      headerUrl = URL.createObjectURL(data)
    }
  })
</script>

<header style="--header-path: url({$headerPreview || headerUrl || '/header.jpg'})">
  <a href='/' id='logo'>
    <img src='/logo.png' alt='Andor2.cz logo'>
  </a>
  <nav class='tabs'>
    <a href='/' class={pathname === '/' ? 'active' : ''}>Novinky</a>
    <a href='/games' class={pathname.includes('/game') ? 'active' : ''}>Hry</a>
    <a href='/boards' class={pathname.includes('/board') ? 'active' : ''}>Diskuze</a>
    <a href='/chat' class={pathname.includes('/chat') ? 'active' : ''}>Chat</a>
  </nav>
</header>

<style>
  header {
    position: relative;
    height: 226px;
    background-image: var(--header-path);
    background-position: top right;
  }
    #logo {
      position: absolute;
      top: 40px;
      left: 50px;
    }
      #logo img {
        width: 190px;
        height: 90px;
      }
    nav {
      position: absolute;
      bottom: -1px;
      left: 30px;
    }

  @media (max-width: 860px) {
    nav {
      left: 10px;
    }
    header {
      height: 150px;
      background-size: cover;
    }
      #logo {
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
      }
        #logo img {
          width: 120px;
          object-fit: contain;
        }
  }
</style>
