<script>
  export let activeUsers = []
</script>

{#if activeUsers.length}
  <h3>Právě online</h3>
  <ul>
    {#each activeUsers as user}
      <li><button>{user.name}</button></li>
    {/each}
  </ul>
{:else}
  <div class='empty'>Nikdo tu není</div>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0px;
    margin: 0px;
  }
    li {
      padding: 0px 15px;
    }
  h3 {
    font-size: 20px;
    margin: 10px 0px;
    color: var(--dim);
  }
  button {
    font-weight: bold;
    background: none;
    border: 0px;
    padding: 5px;
    display: block;
    width: 100%;
    text-align: left;
    box-shadow: none;
    color: var(--accent);
  }
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
</style>
