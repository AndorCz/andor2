<script>
  import { getHeaderUrl } from '@lib/database'
  import { isFilledArray } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'

  export let user = {}
  export let boards = []
  export let showHeadline = false

  let listView = false
</script>

{#if showHeadline}
  <div class='headline flex'>
    <h1>Diskuze</h1>
    <div class='buttons'>
      <div class='toggle'>
        <button on:click={() => { listView = false }} class:active={!listView} class='material'>table_rows</button>
        <button on:click={() => { listView = true }} class:active={listView} class='material'>table_rows_narrow</button>
      </div>
      {#if user.id}
        <a href='./board/board-form' class='button desktop'>Vytvořit novou diskuzi</a>
        <a href='./board/board-form' class='button mobile material'>add</a>
      {/if}
    </div>
  </div>
{/if}

{#if isFilledArray(boards)}
  {#if listView}
    <table class='list'>
      <tr>
        <th>název</th>
        <th>příspěvků</th>
        <th>správce</th>
      </tr>
      {#each boards as board}
        <tr class='board'>
          <td><div class='name'><a href='./board/{board.id}'>{board.name}</a></div></td>
          <td><div class='count'>{board.post_count}</div></td>
          <td><div class='owner user'>{board.owner_name}</div></td>
        </tr>
      {/each}
    </table>
  {:else}
    {#each boards as board}
      <div class='block'>
        <div class='col left'>
          <div class='row basics'>
            <div class='name'><a href='./board/{board.id}'>{board.name}</a></div>
            <div class='count' title='příspěvků'>{board.post_count}<span class='material ico'>chat</span></div>
            <div class='owner user' title='správce'>{board.owner_name}</div>
          </div>
          <div class='row annotation' title={board.header} use:tooltip>{board.header}</div>
        </div>
        {#if board.custom_header}
          <div class='col image'>
            <img src={getHeaderUrl('board', board.id)} alt='board header' />
          </div>
        {/if}
      </div>
    {/each}
  {/if}
{:else}
  <p>Žádné diskuze nenalezeny</p>
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
    min-height: 115px;
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
        font-style: italic;
        padding-top: 5px;
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
    .toggle {
      display: none;
    }
  }

  @media (max-width: 860px) {
    h1 {
      padding-left: 10px;
    }
    .desktop { display: none }
    .mobile { display: block }
    .button {
      padding: 10px;
    }
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
