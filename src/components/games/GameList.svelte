<script>
  import { onMount } from 'svelte'
  import { getHeaderUrl } from '@lib/database'
  import { isFilledArray } from '@lib/utils'
  import { getSavedStore } from '@lib/stores'
  import { gameCategories, gameSystems } from '@lib/constants'
  import { tooltip } from '@lib/tooltip'

  export let user = {}
  export let games = []
  export let showHeadline = false

  let sort = 'new'
  let listView = false
  let gameListStore

  function getCategory (value) { return gameCategories.find(category => category.value === value).label }
  function getSystem (value) { return gameSystems.find(system => system.value === value).label }

  onMount(() => { // get sort parameter from url
    const sortParam = new URL(window.location).searchParams.get('sort')
    if (sortParam) { sort = sortParam }

    gameListStore = getSavedStore('boards', { listView: false })
    listView = $gameListStore.listView
  })

  function setSort (type) {
    sort = type
    window.location.search = new URLSearchParams({ sort: type }).toString()
  }

  function setListView (val) {
    listView = $gameListStore.listView = val
  }
</script>

{#if showHeadline}
  <div class='headline flex'>
    <h1>Hry</h1>
    <div class='buttons'>
      <div class='toggle sort'>
        <button on:click={() => { setSort('new') }} class:active={sort === 'new'}>Nové</button>
        <button on:click={() => { setSort('active') }} class:active={sort === 'active'}>Aktivní</button>
      </div>
      <div class='toggle compact'>
        <button on:click={() => { setListView(false) }} class:active={!listView} class='material'>table_rows</button>
        <button on:click={() => { setListView(true) }} class:active={listView} class='material'>table_rows_narrow</button>
      </div>
      {#if user.id}
        <a href='./game/game-form' class='button desktop'>Vytvořit novou hru</a>
        <a href='./game/game-form' class='button mobile material'>add</a>
      {/if}
    </div>
  </div>
{/if}

{#if isFilledArray(games)}
  {#if listView}
    <table class='list'>
      <tr>
        <th>název</th>
        <th>kategorie</th>
        <th>systém</th>
        <th>příspěvků</th>
        <th>vlastník</th>
      </tr>
      {#each games as game}
        <tr class='gameLine'>
          <td><div class='name'><a href='./game/{game.id}'>{game.name}</a></div></td>
          <td><div class='category'>{getCategory(game.category)}</div></td>
          <td><div class='system'>{getSystem(game.system)}</div></td>
          <td><div class='count'>{game.post_count}</div></td>
          <td><div class='owner user'>{game.owner_name}</div></td>
        </tr>
      {/each}
    </table>
  {:else}
    {#each games as game}
      <div class='block'>
        <div class='col left'>
          <div class='row basics'>
            <div class='name'><a href='./game/{game.id}'>{game.name}</a></div>
            <div class='category' title='kategorie'>{getCategory(game.category)}</div>
            {#if game.system !== 'base'}<div class='system' title='systém'>{getSystem(game.system)}</div>{/if}
            <div class='count' title='příspěvků'>{game.post_count}<span class='material ico'>chat</span></div>
            <div class='owner' title='správce'><a href={'./user?id=' + game.owner} class='user'>{game.owner_name}</a></div>
          </div>
          <div class='row annotation' title={game.annotation} use:tooltip>{game.annotation}</div>
        </div>
        {#if game.custom_header}
          <div class='col image'>
            <img src={getHeaderUrl('game', game.id)} alt='game header' />
          </div>
        {/if}
      </div>
    {/each}
  {/if}
{:else}
  <p>Žádné hry nenalezeny</p>
{/if}

<style>
  .headline {
    justify-content: space-between;
  }
  .mobile { display: none }
  .desktop { display: block }

  .buttons {
    display: flex;
    gap: 20px;
  }
  .name a:first-letter {
    text-transform: uppercase;
  }

  /* blocks */

  .block {
    background-color: var(--block);
    display: flex;
    margin-bottom: 5px;
  }
    .block .left {
      padding: 10px;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
    }
      .block .row {
        padding: 10px;
      }
      .block .basics {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        padding-bottom: 5px;
        justify-content: space-between;
        align-items: center;
      }
        .block .name {
          flex: 1;
        }
          .block .name a {
            font-size: 24px;
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
      .block .annotation {
        padding-top: 5px;
        font-style: italic;
        color: var(--dim);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

  @media (max-width: 1200px) {
    .block .name {
      flex-basis: 100%;
    }
    .compact {
      display: none;
    }
  }

  @media (max-width: 860px) {
    h1 {
      padding-left: 10px;
    }
    .desktop { display: none }
    .mobile { display: block }
    .button { padding: 10px }
  }

  @media (max-width: 500px) {
    .block {
      display: block;
    }
    .block .image {
      width: 100%;
    }
  }
</style>
