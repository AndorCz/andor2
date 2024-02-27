<script>
  export let users = []
  export let openConversation

  let showOffline = false

  const unreadGroup = []
  const activeGroup = []
  const offlineGroup = []

  function updateGroups () {
    // group users by unread, friends, active
    users.forEach(user => {
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
  <h4>Nepřečtené</h4>
  <ul class='unread'>
    {#each unreadGroup as user}
      <li>
        <button on:click={() => openConversation({ them: user, type: 'user' })}>
          {#if user.portrait}
            <img src={user.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='gap'></span>
          {/if}
          <span class='name user'>{user.name}</span>
          <span class='new'>{user.unread || ''}</span>
          {#if user.active}<span class='status'></span>{/if}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<h4 class='toggle'>
  <button on:click={() => { showOffline = false }} class='secondary' class:active={!showOffline}>Online</button>
  <button on:click={() => { showOffline = true }} class='secondary' class:active={showOffline}>Offline</button>
</h4>

{#if !showOffline}
  {#if activeGroup.length}
    <ul class='active'>
      {#each activeGroup as user}
        <li>
          <button on:click={() => openConversation({ them: user, type: 'user' })}>
            {#if user.portrait}
              <img src={user.portrait} class='portrait' alt='portrait'>
            {:else}
              <span class='gap'></span>
            {/if}
            <span class='name user'>{user.name}</span>
            {#if user.active}<span class='status'></span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class='empty'>Nikdo není online</div>
  {/if}
{:else}
  {#if offlineGroup.length}
    <ul class='offline'>
      {#each offlineGroup as user}
        <li>
          <button on:click={() => openConversation({ them: user, type: 'user' })}>
            {#if user.portrait}
              <img src={user.portrait} class='portrait' alt='portrait'>
            {:else}
              <span class='gap'></span>
            {/if}
            <span class='name user'>{user.name}</span>
            {#if user.active}<span class='status'></span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class='empty'>Žádné konverzace</div>
  {/if}
{/if}

<style>
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
  h4 {
    color: var(--dim);
    margin: 0px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }
  .toggle {
    display: flex;
    justify-content: space-between;
  }
    .toggle button {
      font-family: var(--headlineFont);
      padding: 0px;
    }
    .toggle button.active {
      box-shadow: none;
      color: var(--text);
    }
  ul {
    list-style: none;
    padding: 0px;
    margin: 0px;
  }
    ul.offline {
      opacity: 0.5;
    }
    ul.unread {
      margin-bottom: 20px;
    }
    ul button {
      position: relative;
      font-weight: bold;
      background: none;
      border: 0px;
      padding: 5px;
      padding-left: 0px;
      display: block;
      width: 100%;
      text-align: left;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
      button:hover .name {
        color: var(--maximum);
      }
      button:hover .new {
        color: var(--maximum);
      }
      button:hover .portrait {
        transform: scale(1.1);
      }
      .name {
        flex: 1;
      }
      .portrait, .gap {
        display: block;
        width: 40px;
        height: 40px;
        object-fit: cover;
        object-position: center 20%;
        border-radius: 100%;
        background-color: var(--background);
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
</style>
