<script>
  import { user } from '@lib/stores'
</script>

<aside>
  {#if $user}
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
    background-color: #2b2827;
  }
    aside a {
      font-family: 'Alegreya Sans';
    }

  .w100 {
    width: 100%;
  }
</style>
