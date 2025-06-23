<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { getSavedStore } from '@lib/stores'
  import { isFilledArray, addURLParam } from '@lib/utils'
  import { gameCategories, gameSystems } from '@lib/constants'
  import { platform as platformStore } from '@components/common/MediaQuery.svelte'
  import { tooltip } from '@lib/tooltip'

  const { user = {}, games = [], showHeadline = false, showTabs = true, page = 0, maxPage = 0 } = $props()

  let listView = $state(false)
  let gameListStore
  let activeTab = $state('open')
  let sort = $state('new')
  const platform = $derived($platformStore)

  function getCategory (value) { return gameCategories.find(category => category.value === value).label }
  function getSystem (value) { return gameSystems.find(system => system.value === value).label }

  // functions to run only in the browser
  let getHeaderUrl = $state(() => {})
  let getPortraitUrl = $state(() => {})

  onMount(async () => { // get sort parameter from url
    const databaseBrowser = await import('@lib/database-browser')
    getHeaderUrl = databaseBrowser.getHeaderUrl
    getPortraitUrl = databaseBrowser.getPortraitUrl

    const tabParam = new URL(window.location).searchParams.get('tab')
    if (tabParam) { activeTab = tabParam }

    const sortParam = new URL(window.location).searchParams.get('sort')
    if (sortParam) { sort = sortParam }

    gameListStore = getSavedStore('boards', { listView: false })
    listView = get(gameListStore).listView
  })

  function activateTab (tab) {
    activeTab = tab
    const newUrl = addURLParam('tab', tab, true)
    window.location.href = newUrl
  }

  function setListView (val) {
    listView = val
    gameListStore.update(store => {
      store.listView = val
      return store
    })
  }

  function setSort (e) {
    const newUrl = addURLParam('sort', e.target.value, true)
    window.location.href = newUrl
  }

  function triggerPaging (newPage) {
    const newUrl = addURLParam('page', newPage, true)
    window.location.href = newUrl
  }
</script>

{#if showHeadline}
  <div class='headline flex'>
    <h1>Hry</h1>
    <div class='buttons'>
      <select bind:value={sort} onchange={setSort}>
        <option value='new'>Dle data</option>
        <option value='active'>Dle aktivity</option>
        <option value='name'>Dle názvu</option>
        <option value='category'>Dle kategorie</option>
        <option value='system'>Dle systému</option>
        <option value='count'>Dle příspěvků</option>
        <option value='owner'>Dle vlastníka</option>
      </select>
      {#if platform === 'desktop'}
        <div class='toggle mode'>
          <button onclick={() => { setListView(false) }} class:active={!listView} class='material'>table_rows</button>
          <button onclick={() => { setListView(true) }} class:active={listView} class='material'>table_rows_narrow</button>
        </div>
      {/if}
      {#if user.id}
        <a href='./game/game-form' class='button desktop'>Vytvořit novou hru</a>
        <a href='./game/game-form' class='button mobile material'>add</a>
      {/if}
    </div>
  </div>
{/if}

{#if showTabs}
  <nav class='tabs secondary'>
    <button onclick={() => { activateTab('open') }} class:active={activeTab === 'open'}>Nábor</button>
    <button onclick={() => { activateTab('public') }} class:active={activeTab === 'public'}>Veřejné</button>
    <button onclick={() => { activateTab('private') }} class:active={activeTab === 'private'}>Soukromé</button>
    <button onclick={() => { activateTab('archive') }} class:active={activeTab === 'archive'}>Archiv</button>
    <button onclick={() => { activateTab('all') }} class:active={activeTab === 'all'}>Vše</button>
  </nav>
{/if}

{#if isFilledArray(games)}
  {#if listView && platform === 'desktop'}
    <table class='list'>
      <thead><tr><th>název</th><th>kategorie</th><th>systém</th><th>příspěvků</th><th>vlastník</th></tr></thead>
      <tbody>
        {#each games as game}
          <tr class='gameLine'>
            <td><div class='name'><a href='./game/{game.id}'>{game.name}</a></div></td>
            <td><div class='category'>{getCategory(game.category)}</div></td>
            <td><div class='system'>{getSystem(game.system)}</div></td>
            <td><div class='count'>{game.post_count}</div></td>
            <td>
              <a href='./user?id={game.owner_id}' class='user owner'>
                <span>{game.owner_name}</span>
                {#if game.owner_portrait}<img src={getPortraitUrl(game.owner_id, game.owner_portrait)} class='icon' alt={game.owner_name} />{/if}
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    {#each games as game}
      <div class='block'>
        {#if game.custom_header}
          <div class='col image'>
            <img src={getHeaderUrl('game', game.id, game.custom_header)} alt='game header' />
          </div>
        {/if}
        <div class='col left'>
          <div class='name'><a href='./game/{game.id}'>{game.name}</a></div>
          <div class='annotation' title={game.annotation} use:tooltip>{game.annotation || ''}</div>
          <div class='meta'>
            <div class='category' title='kategorie'>{getCategory(game.category)}</div>
            {#if game.system !== 'base'}<div class='system' title='systém'>{getSystem(game.system)}</div>{/if}
            <div class='count' title='příspěvků'>{game.post_count}<span class='material ico'>chat</span></div>
            <a href='./user?id={game.owner_id}' class='user owner' title='vlastník'>
              {game.owner_name}
              {#if game.owner_portrait}<img src={getPortraitUrl(game.owner_id, game.owner_portrait)} class='icon' alt={game.owner_name} />{/if}
            </a>
          </div>
        </div>
      </div>
    {/each}
  {/if}
{:else}
  <p class='info'>Žádné hry nenalezeny</p>
{/if}

{#if maxPage > 0}
  <div class='pagination'>
    {#each { length: maxPage + 1 } as _, i}
      <button onclick={() => { triggerPaging(i) } } disabled={i === page}>{i + 1}</button>
    {/each}
  </div>
{/if}

<style>
  .info {
    padding: 20px;
    text-align: center;
  }
  .headline {
    justify-content: space-between;
  }
  .mobile { display: none }
  .desktop { display: block }

  .buttons {
    display: flex;
    gap: 20px;
  }
    .buttons select {
      width: fit-content;
      padding: 10px;
      padding-right: 35px;
      font-size: 16px;
    }
  .name a:first-letter {
    text-transform: uppercase;
  }

  .tabs {
    margin-bottom: 20px;
  }

  .owner {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
    .icon {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: cover;
      object-position: center 20%;
      border-radius: 100%;
      background-color: var(--background);
    }
  .list .owner {
    padding-right: 20px;
  }

  /* blocks */

  .block {
    background-color: var(--block);
    display: flex;
    flex-direction: row-reverse;
    margin-bottom: 5px;
    min-height: 115px;
  }
    .block .left {
      padding: 20px;
      padding-bottom: 10px;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
    }
      .block .name a {
        font-size: 22px;
      }
      .block .annotation {
        font-style: italic;
        padding: 5px 0px;
        color: var(--dim);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .block .meta {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 20px;
      }
        .block .count {
          font-family: arial, sans-serif;
          font-size: 16px;
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .block .ico {
          font-size: 16px;
        }
    .block .image {
      width: 30%;
      overflow: hidden;
    }
      .block .image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

  /* list */

  .list {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 2px;
  }
    th {
      text-align: left;
      padding: 10px 0px;
      font-variation-settings: 'wght' 300;
      color: var(--dim);
    }
      th:first-child {
        padding-left: 20px;
      }
    td {
      background-color: var(--block);
      margin-bottom: 2px;
    }
      .list .name a {
        display: inline-block;
        width: 100%;
        height: 100%;
        padding: 20px;
      }

  .pagination {
    text-align: center;
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 18px;
      padding: 0px;
      width: 40px;
      height: 40px;
    }

  @media (max-width: 1200px) {
    .block .name {
      flex-basis: 100%;
    }
  }

  @media (max-width: 860px) {
    h1 { padding-left: 10px }
    .desktop { display: none }
    .mobile { display: block }
    .headline .button, .headline button {
      padding: 10px;
    }
  }

  @media (max-width: 500px) {
    .block {
      display: block;
      margin-bottom: 10px;
    }
    .block .left { padding: 15px 10px }
    .block .image { width: 100% }
    .mode { display: none }
    .headline .button, .headline button {
      padding: 7px;
    }
  }
</style>
