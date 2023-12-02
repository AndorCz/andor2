<script>
  export let pathname
</script>

<header>
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
    background-image: url('/header.jpg');
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