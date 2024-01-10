<script>
  export let activeUsers = []
  export let openChat
</script>

{#if activeUsers.length}
  <h3>Právě online</h3>
  <ul>
    {#each activeUsers as user}
      <li>
        <button on:click={() => openChat(user)}>
          {#if user.portrait}
            <img src={user.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='gap'></span>
          {/if}
          <span class='name'>{user.name}</span>
        </button>
      </li>
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
    display: flex;
    align-items: center;
    gap: 10px;
  }
    button:hover {
      color: var(--maximum);
    }
    .portrait, .gap {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 100%;
    }
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
</style>
