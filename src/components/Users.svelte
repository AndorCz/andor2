<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, getPortrait } from '@lib/database'

  let users = []
  let page = 0
  let topEl
  let pages = null
  let searchEl
  let total = 0
  const limit = 100

  onMount(() => { loadUsers() })

  async function loadUsers () {
    const offset = page * limit
    const { count, data, error } = await supabase.from('profiles').select('*', { count: 'exact' }).range(offset, offset + limit - 1)
    if (error) { return handleError(error) }
    users = data
    total = count
    pages = Math.ceil(count / limit)
  }

  function triggerPaging (newPage) {
    page = newPage
    loadUsers()
    topEl.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSearch () {
    const { count, data, error } = await supabase.from('profiles').select('*', { count: 'exact' }).ilike('name', `%${searchEl.value}%`)
    if (error) { return handleError(error) }
    users = data
    pages = Math.ceil(count / limit)
  }
</script>

<h1 bind:this={topEl}>
  Uživatelé&nbsp;({total})
  <div class='searchBox'>
    <!-- svelte-ignore a11y-autofocus -->
    <input bind:this={searchEl} type='text' size='30' placeholder='vyhledat' autofocus on:keydown={(e) => { if (e.key === 'Enter') { handleSearch() } }} />
    <button class='material' on:click={handleSearch}>search</button>
  </div>
</h1>

{#if users.length}
  <div class='users'>
    {#each users as user}
      <div class='user'>
        {#if user.portrait}
          {#await getPortrait(user.id, user.portrait) then url}<img src={url} class='portrait' alt={user.name} />{/await}
        {:else}
          <span class='gap'></span>
        {/if}
        <a href={`user?id=${user.id}`} class='name'>{user.name}</a>
      </div>
    {/each}
  </div>
  <div class='pagination'>
    {#each { length: pages } as _, i}
      <button on:click={() => { triggerPaging(i) } } disabled={i === page}>{i + 1}</button>
    {/each}
  </div>
{:else}
  <div class='empty'>Žádní uživatelé</div>
{/if}

<style>
  h1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
    .searchBox {
      background: var(--panel);
      display: flex;
      width: fit-content;
      gap: 10px;
      padding: 20px;
    }

  .users {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
    .user {
      display: flex;
      align-items: center;
      gap: 20px;
    }
      .portrait, .gap {
        display: block;
        width: 80px;
        height: 80px;
        object-fit: cover;
        object-position: center 20%;
        border-radius: 100%;
        background-color: var(--background);
      }
      .name {
        font-size: 24px;
      }

  .pagination {
    text-align: center;
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 22px;
      padding: 15px 25px;
    }

  @media (max-width: 600px) {
    h1 {
      flex-direction: column;
      gap: 20px;
    }
      .searchBox {
        width: 100%;
      }
  }
</style>
