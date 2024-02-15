<script>
  export let user = {}
  export let boards = []
</script>

<div class='headline flex'>
  <h1>Diskuze</h1>
  <div class='buttons'>
    <div class='toggle'>
      <button class='material active'>table_rows</button>
      <button class='material'>table_rows_narrow</button>
    </div>
    {#if user.id}
      <a href='./board/board-form' class='button desktop'>Vytvořit novou diskuzi</a>
      <a href='./board/board-form' class='button mobile material'>add</a>
    {/if}
  </div>
</div>

{#if boards?.length > 0}
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
        <td><div class='owner'>{board.owner_name}</div></td>
      </tr>
    {/each}
  </table>
{:else}
  <p>Žádné diskuze nenalezeny</p>
{/if}

<style>
  .headline {
    justify-content: space-between;
  }
  .mobile { display: none }
  .desktop { display: block }

  /* blocks */

  .gameBlock {
    padding: 10px;
    background-color: var(--block);
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
      .name a {
        display: inline-block;
        width: 100%;
        height: 100%;
        padding: 20px;
      }
      .name a:first-letter {
        text-transform: uppercase;
      }

  @media (max-width: 860px) {
    .desktop { display: none }
    .mobile { display: block }
    .button {
      padding: 10px;
    }
  }
</style>
