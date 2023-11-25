<script>
  export let user
  export let profile
</script>

<aside>
  {#if profile}
    {profile.name}
  {/if}
  {#if user}
    {user.email}<br><br>
    <a href='./api/auth/logout'>Odhlásit</a>
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
    aside a {
      font-family: 'Alegreya Sans';
    }

  .w100 {
    width: 100%;
  }
</style>
