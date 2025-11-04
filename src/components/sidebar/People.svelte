<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import { supabase, getPortraitUrl, handleError } from '@lib/database-browser'

  const { user, users = [], openConversation } = $props()

  let groups = $state({ unread: [], active: [], contacts: [] })
  let showContacts = $state(false)

  onMount(() => {
    const next = { unread: [], active: [], contacts: [] }
    users.forEach(user => {
      if (user.unread) {
        next.unread.push(user)
      } else {
        if (user.active) { next.active.push(user) }
        if (user.contacted) { next.contacts.push(user) }
      }
    })
    groups = next
  })

  async function deleteContact (userId) {
    const { error } = await supabase.from('contacts').delete().match({ owner: user.id, contact_user: userId })
    if (error) { return handleError(error) }
    groups = { ...groups, contacts: groups.contacts.filter(contact => contact.id !== userId) }
    showSuccess('Konverzace odebrána')
  }
</script>

{#if groups.unread.length}
  <h4>Nepřečtené</h4>
  <ul class='unread'>
    {#each groups.unread as user (user.id)}
      <li>
        <button class='opener' onclick={() => openConversation({ them: user, type: 'user' })}>
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
  <button onclick={() => { showContacts = false }} class='secondary' class:active={!showContacts}>Online</button>
  <button onclick={() => { showContacts = true }} class='secondary' class:active={showContacts}>Kontakty</button>
</h4>

{#if !showContacts}
  {#if groups.active.length}
    <ul class='active'>
      {#each groups.active as user (user.id)}
        <li>
          <button class='opener' onclick={() => openConversation({ them: user, type: 'user' })}>
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
  {#if groups.contacts.length}
    <ul class='contacts'>
      {#each groups.contacts as user (user.id)}
        <li class:offline={!user.active} class='row'>
          <button class='opener' onclick={() => openConversation({ them: user, type: 'user' })}>
            {#if user.portrait}
              <img src={getPortraitUrl(user.id, user.portrait)} class='portrait' alt={user.name} />
            {:else}
              <span class='gap'></span>
            {/if}
            <span class='name user'>{user.name}</span>
            {#if user.active}<span class='status'></span>{/if}
          </button>
          <button onclick={() => deleteContact(user.id)} class='material square hide plain' title='Skrýt konverzaci' use:tooltip>visibility_off</button>
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
  .status {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 2px 2px 4px #0006;
    background-color: var(--accent);
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
    .row {
      display: flex;
    }
    li.offline {
      opacity: 0.5;
    }
    ul.unread {
      margin-bottom: 20px;
    }
    .opener {
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
      flex: 1;
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
      .hide {
        font-size: 18px;
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
