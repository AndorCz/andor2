<script>
  import { onMount } from 'svelte'
  import { headerPreview } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'

  export let customImage
  export let pathname

  let header

  onMount(async () => {
    if (customImage) {
      const { data, error } = await supabase.storage.from('headers').download(customImage)
      if (error) { return handleError(error) }
      header = URL.createObjectURL(data)
    }
  })
</script>

<header style="--header-path: url({$headerPreview || header || '/header.jpg'})">
  <a href='/' id='logo'>
    <img src='/logo.png' alt='Andor2.cz logo'>
  </a>
  <nav class='tabs'>
    <a href='/' class={pathname === '/' ? 'active' : ''}>Novinky</a>
    <a href='/games' class={pathname === '/games' ? 'active' : ''}>Hry</a>
  </nav>
</header>

<style>
  header {
    position: relative;
    height: 226px;
    background-image: var(--header-path);
    background-position: right;
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
      bottom: 0px;
      left: 30px;
    }
</style>
