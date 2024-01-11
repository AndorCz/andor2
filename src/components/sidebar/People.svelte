<script>
  export let openChat
  export let allRelevantUsers = {}
  export let numberOnline = 0
  export let showOffline = false

  const unreadGroup = []
  const activeGroup = []
  const offlineGroup = []

  function updateGroups () {
    // group users by unread, friends, active
    Object.values(allRelevantUsers).forEach(user => {
      if (user.unread) {
        unreadGroup.push(user)
      } else if (user.active) {
        activeGroup.push(user)
      } else {
        offlineGroup.push(user)
      }
    })
  }

  $: updateGroups()
</script>

{#if unreadGroup.length}
  <ul class='unread'>
    {#each unreadGroup as user}
      <li>
        <button on:click={() => openChat(user)}>
          {#if user.portrait}
            <img src={user.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='gap'></span>
          {/if}
          <span class='name'>{user.name}</span>
          <span class='new'>{user.unread}</span>
          {#if user.active}<span class='status'></span>{/if}
        </button>
      </li>
    {/each}
  </ul>
{/if}
{#if activeGroup.length}
  <ul class='active'>
    {#each activeGroup as user}
      <li>
        <button on:click={() => openChat(user)}>
          {#if user.portrait}
            <img src={user.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='gap'></span>
          {/if}
          <span class='name'>{user.name}</span>
          {#if user.active}<span class='status'></span>{/if}
        </button>
      </li>
    {/each}
  </ul>
{/if}
{#if offlineGroup.length}
  <ul class='offline'>
    {#each offlineGroup as user}
      <li>
        <button on:click={() => openChat(user)}>
          {#if user.portrait}
            <img src={user.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='gap'></span>
          {/if}
          <span class='name'>{user.name}</span>
          {#if user.active}<span class='status'></span>{/if}
        </button>
      </li>
    {/each}
  </ul>
{/if}
{#if !showOffline && numberOnline === 0}
  <div class='empty'>Nikdo není online</div>
{/if}

<button on:click={() => { showOffline = !showOffline }} class='toggleOffline secondary'>
  {#if showOffline}Skrýt neaktivní{:else}Zobrazit neaktivní{/if}
</button>

<style>
  ul {
    list-style: none;
    padding: 0px;
    margin: 0px;
  }
    ul.offline {
      opacity: 0.5;
    }
  /*
  h3 {
    font-size: 20px;
    margin: 10px 0px;
    color: var(--dim);
  }
  */
    ul button {
      position: relative;
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
      justify-content: space-between;
      gap: 10px;
    }
      button:hover {
        color: var(--maximum);
      }
      button:hover .new {
        color: var(--maximum);
      }
      .name {
        flex: 1;
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
  .new {
    color: var(--new);
    pointer-events: none;
  }
  .toggleOffline {
    margin: auto;
    margin-top: 20px;
    display: block;
    font-size: 16px;
  }
</style>
