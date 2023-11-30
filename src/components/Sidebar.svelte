<script>
  export let user

  function logout () {
    // delete cookies
    document.cookie = 'sb-access-token=; Max-Age=-99999999;'
    document.cookie = 'sb-refresh-token=; Max-Age=-99999999;'
    window.location.href = './api/auth/logout'
  }
</script>

<aside>
  {#if user.name}
    {user.name}<br><br>
    <button on:click={logout}>Odhlásit</button>
  {:else if user.email}
    {user.email}<br><br>
    <button on:click={logout}>Odhlásit</button>
  {:else}
    <form action='/api/auth/login' method='post'>
      <button value='google' name='provider' type='submit' class='google w100'>Přihlásit přes Google</button>
    </form>
  {/if}
</aside>

<style>
  aside {
    width: 280px;
    margin-left: 20px;
    padding: 20px;
    background-color: var(--panel);
    border-radius: 0px 0px 10px 10px;
  }
  .w100 {
    width: 100%;
  }
</style>
