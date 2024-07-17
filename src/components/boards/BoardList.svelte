<script>
  import { onMount } from 'svelte'
  import { getSavedStore } from '@lib/stores'
  import { isFilledArray } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'

  export let user = {}
  export let boards = []
  export let showHeadline = false
  export let compactOnly = false

  let listView = false
  let boardListStore

  // functions to run only in the browser
  let getHeaderUrl = () => {}
  let getPortraitUrl = () => {}

  onMount(async () => {
    const databaseBrowser = await import('@lib/database-browser')
    getHeaderUrl = databaseBrowser.getHeaderUrl
    getPortraitUrl = databaseBrowser.getPortraitUrl
    boardListStore = getSavedStore('boards', { listView: false })
    listView = $boardListStore.listView
  })

  function setListView (val) {
    listView = $boardListStore.listView = val
  }
</script>

{#if showHeadline}
  <div class='headline flex'>
    <h1>Diskuze</h1>
    <div class='buttons'>
      <div class='toggle'>
        <button on:click={() => { setListView(false) }} class:active={!listView} class='material'>table_rows</button>
        <button on:click={() => { setListView(true) }} class:active={listView} class='material'>table_rows_narrow</button>
      </div>
      {#if user.id}
        <a href='./board/board-form' class='button desktop'>Vytvořit novou diskuzi</a>
        <a href='./board/board-form' class='button mobile material'>add</a>
      {/if}
    </div>
  </div>
{/if}

{#if isFilledArray(boards)}
  {#if listView || compactOnly}
    <table class='list'>
      <tr><th>název</th><th>příspěvků</th><th>vlastník</th></tr>
      {#each boards as board}
        <tr class='board'>
          <td><div class='name'><a href='./board/{board.id}'>{board.name}</a></div></td>
          <td><div class='count'>{board.post_count}</div></td>
          <td>
            <a href='./user?id={board.owner_id}' class='user owner' title='vlastník'>
              {board.owner_name}
              {#if board.owner_portrait}<img src={getPortraitUrl(board.owner_id, board.owner_portrait)} class='icon' alt={board.owner_name} />{/if}
            </a>
          </td>
      </tr>
      {/each}
    </table>
  {:else}
    {#each boards as board}
      <div class='block'>
        {#if board.custom_header}
          <div class='col image'>
            <img src={getHeaderUrl('board', board.id, board.custom_header)} alt='board header' />
          </div>
        {/if}
        <div class='col left'>
          <div class='name'><a href='./board/{board.id}'>{board.name}</a></div>
          <div class='annotation' title={board.annotation} use:tooltip>{board.annotation || ''}</div>
          <div class='meta'>
            <div class='count' title='příspěvků'>{board.post_count}<span class='material ico'>chat</span></div>
            {#if ![1, 2, 3].includes(board.id)}
              <a href='./user?id={board.owner_id}' class='user owner' title='vlastník'>
                <span>{board.owner_name}</span>
                {#if board.owner_portrait}<img src={getPortraitUrl(board.owner_id, board.owner_portrait)} class='icon' alt={board.owner_name} />{/if}
              </a>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  {/if}
{:else}
  <p class='info'>Žádné diskuze nenalezeny</p>
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
  .name a:first-letter {
    text-transform: uppercase;
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
        font-size: 24px;
      }
      .block .annotation {
        font-style: italic;
        padding-top: 5px;
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
    .headline .button, .headline button {
      padding: 7px;
    }
  }

</style>
