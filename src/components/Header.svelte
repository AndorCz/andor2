<script>
  import { onMount } from 'svelte'
  import { headerPreview } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import Lightbox from '@components/common/Lightbox.svelte'

  export let pathname
  export let headerStatic
  export let headerStorage

  let headerUrl = headerStatic

  async function getHeaderUrl () {
    const { data, error } = await supabase.storage.from('headers').getPublicUrl(headerStorage)
    if (error) { return handleError(error) }
    headerUrl = data.publicUrl
  }

  onMount(() => { $headerPreview = null }) // clear preview, only used momentarily after upload

  $: if (headerStorage) { getHeaderUrl() }
</script>

<header style="--header-path: url({$headerPreview || headerUrl || '/header.jpg'})">
  <!-- svelte-ignore a11y-missing-content -->
  <a href='/' id='logo'></a>
  <nav class='tabs'>
    <a href='/' class={pathname === '/' ? 'active' : ''}>Novinky</a>
    <a href='/games' class={pathname.includes('/game') ? 'active' : ''}>Hry</a>
    <a href='/works' class={pathname.includes('/work') ? 'active' : ''}>Tvorba</a>
    <a href='/boards' class={pathname.includes('/board') ? 'active' : ''}>Diskuze</a>
    <a href='/chat' class={pathname.includes('/chat') ? 'active' : ''}>Chat</a>
  </nav>
</header>

<Lightbox />

<style>
  header {
    position: relative;
    height: 226px;
    background-image: var(--header-path);
    background-position: top right;
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

  @media (max-width: 500px) {
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
  }
</style>
