<script>
  import { gameCategories, gameSystems } from '@lib/constants'

  function getCategory (value) { return gameCategories.find(category => category.value === value).label }
  function getSystem (value) { return gameSystems.find(system => system.value === value).label }

  export let games = []
</script>

{#if games?.length > 0}
  <table id='games'>
    <tr>
      <th>název</th>
      <th>kategorie</th>
      <th>systém</th>
      <th>příspěvků</th>
      <th>správce</th>
    </tr>
    {#each games as game}
      <tr class='game'>
        <td><div class='name'><a href='./game/{game.id}'>{game.name}</a></div></td>
        <td><div class='category'>{getCategory(game.category)}</div></td>
        <td><div class='system'>{getSystem(game.system)}</div></td>
        <td><div class='count'>{game.post_count}</div></td>
        <td><div class='owner'>{game.owner_name}</div></td>
      </tr>
    {/each}
  </table>
{:else}
  <p>Žádné hry nenalezeny</p>
{/if}

<style>
  #games {
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
