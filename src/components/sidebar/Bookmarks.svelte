<script>
  import { bookmarks } from '@lib/stores'

  let bookmarkNumber
  $: bookmarkNumber = $bookmarks.games.length + $bookmarks.boards.length
</script>

{#if Object.keys($bookmarks.games).length > 0}
  <h4>Hry</h4>
  <ul class='games'>
    {#each $bookmarks.games as bookmark}
      <li class='bookmark' class:active={'/game/' + bookmark.game_id === window.location.pathname}>
        <a href={'/game/' + bookmark.game_id}>{bookmark.name}</a>
      </li>
    {/each}
  </ul>
{/if}

{#if Object.keys($bookmarks.boards).length > 0}
  <h4>Diskuze</h4>
  <ul class='boards'>
    {#each $bookmarks.boards as bookmark}
      <li class='bookmark' class:active={'/board/' + bookmark.board_id === window.location.pathname}>
        <a href={'/board/' + bookmark.board_id}>{bookmark.name}</a>
      </li>
    {/each}
  </ul>
{/if}

{#if bookmarkNumber === 0}
  <div class='empty'>Žádné záložky</div>
{/if}

<style>
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
  h4 {
    color: var(--dim);
    margin: 10px 0px;
  }
  ul {
    list-style: none;
    padding: 0px 10px;
  }
    li {
      padding: 8px 0px;
    }
    li a {
      display: block;
    }
    li.active a {
      color: var(--text);
    }
</style>
