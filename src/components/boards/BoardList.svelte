<script>
  export let boards = []
</script>

{#if boards?.length > 0}
  <table id='boards'>
    <tr>
      <th>název</th>
      <th>správce</th>
    </tr>
    {#each boards as board}
      <tr class='board'>
        <td><div class='name'><a href='./board/{board.id}'>{board.name}</a></div></td>
        <td><div class='owner'>{board.owner.name}</div></td>
      </tr>
    {/each}
  </table>
{:else}
  <p>Žádné diskuze nenalezeny</p>
{/if}

<style>
  #boards {
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
</style>
