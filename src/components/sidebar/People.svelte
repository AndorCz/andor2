<script>
  import { getPortraitUrl } from '@lib/database-browser'

  export let users = []
  export let openConversation

  let showContacts = false

  const unreadGroup = []
  const activeGroup = []
  const contactGroup = []

  function updateGroups () {
    // group users by unread, friends, active
    users.forEach(user => {
      if (user.unread) {
        unreadGroup.push(user)
      } else {
        if (user.active) { activeGroup.push(user) }
        if (user.contacted) { contactGroup.push(user) }
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
            <img src={getPortraitUrl(user.id, user.portrait)} class='portrait' alt={user.name} />
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
  <button on:click={() => { showContacts = false }} class='secondary' class:active={!showContacts}>Online</button>
  <button on:click={() => { showContacts = true }} class='secondary' class:active={showContacts}>Kontakty</button>
</h4>

{#if !showContacts}
  {#if activeGroup.length}
    <ul class='active'>
      {#each activeGroup as user}
        <li>
          <button on:click={() => openConversation({ them: user, type: 'user' })}>
            {#if user.portrait}
              <img src={getPortraitUrl(user.id, user.portrait)} class='portrait' alt={user.name} />
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
  {#if contactGroup.length}
    <ul class='contacts'>
      {#each contactGroup as user}
        <li class:offline={!user.active}>
          <button on:click={() => openConversation({ them: user, type: 'user' })}>
            {#if user.portrait}
              <img src={getPortraitUrl(user.id, user.portrait)} class='portrait' alt={user.name} />
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
<a href='/users' class='button search'>Vyhledat</a>

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
    .toggle button.secondary {
      font-family: var(--headlineFont);
      padding: 0px;
    }
      .toggle button.secondary.active, .toggle button.secondary:hover {
        box-shadow: none;
        color: var(--text);
        background-color: initial;
      }
  ul {
    list-style: none;
    padding: 0px;
    margin: 0px;
  }
    li.offline {
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
  .search {
    margin: auto;
    margin-top: 30px;
    display: block;
    width: fit-content;
  }
</style>
