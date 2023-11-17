<script>
  import { user } from '@lib/stores'
</script>

<aside>
  {#if $user}
    <a href='./api/auth/logout'>Odhlásit</a>
  {:else}
    <a href='/login'>Přihlášení</a>
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
</style>
