<script>
  import { onMount } from 'svelte'
  import { bookmarks } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import Sortable from 'sortablejs'

  let bookmarkNumber
  let gamesEl
  let boardsEl
  let worksEl
  let saving = false

  $bookmarks.games.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))
  $bookmarks.boards.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))
  $bookmarks.works.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))

  onMount(() => {
    if ($bookmarks.games.length) {
      new Sortable(gamesEl, { animation: 150, group: { name: 'games', pull: false }, onEnd: (sort) => saveOrder('games', sort) })
    }
    if ($bookmarks.boards.length) {
      new Sortable(boardsEl, { animation: 150, group: { name: 'boards', pull: false }, onEnd: (sort) => saveOrder('boards', sort) })
    }
    if ($bookmarks.works.length) {
      new Sortable(worksEl, { animation: 150, group: { name: 'works', pull: false }, onEnd: (sort) => saveOrder('works', sort) })
    }
  })

  async function saveOrder (type, sort) {
    if (sort.oldIndex === sort.newIndex) { return }
    for (const [index, child] of Array.from(sort.from.children).entries()) {
      const bookmarkId = child.dataset.id
      await updateIndex(bookmarkId, index)
    }
  }

  async function updateIndex (bookmarkId, newIndex) {
    const { data, error } = await supabase.from('bookmarks').update({ index: newIndex }).eq('id', bookmarkId)
    if (error) { handleError(error) }
  }

  $: bookmarkNumber = $bookmarks.games.length + $bookmarks.boards.length + $bookmarks.works.length
</script>

{#if $bookmarks.games.length > 0}
  <h4>Hry</h4>
  <ul class='games' bind:this={gamesEl} class:saving>
    {#each $bookmarks.games as bookmark}
      <li class='bookmark' class:active={'/game/' + bookmark.id === window.location.pathname} data-id={bookmark.bookmark_id}>
        <a href={'/game/' + bookmark.id + '?tab=game'}>
          {bookmark.name}
          {#if bookmark.unread && window.location.pathname !== '/game/' + bookmark.id}
            <span class='unread'>{bookmark.unread}</span>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
{/if}

{#if $bookmarks.boards.length > 0}
  <h4>Diskuze</h4>
  <ul class='boards' bind:this={boardsEl} class:saving>
    {#each $bookmarks.boards as bookmark}
      <li class='bookmark' class:active={'/board/' + bookmark.id === window.location.pathname} data-id={bookmark.bookmark_id}>
        <a href={'/board/' + bookmark.id}>
          {bookmark.name}
          {#if bookmark.unread && window.location.pathname !== '/board/' + bookmark.id}
            <span class='unread'>{bookmark.unread}</span>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
{/if}

{#if $bookmarks.works.length > 0}
  <h4>Tvorba</h4>
  <ul class='works' bind:this={worksEl} class:saving>
    {#each $bookmarks.works as bookmark}
      <li class='bookmark' class:active={'/work/' + bookmark.id === window.location.pathname} data-id={bookmark.bookmark_id}>
        <a href={'/work/' + bookmark.id}>
          {bookmark.name}
          {#if bookmark.unread && window.location.pathname !== '/work/' + bookmark.id}
            <span class='unread'>{bookmark.unread}</span>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
{/if}

{#if bookmarkNumber === 0}
  <div class='empty'>Žádné záložky</div>
{/if}

<style>
  .saving {
    opacity: 0.5;
    pointer-events: none;
  }
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
  h4 {
    color: var(--dim);
    margin: 0px;
  }
  ul {
    list-style: none;
    padding: 0px 10px;
  }
    li {
      padding: 8px 0px;
    }
    li a {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
      .unread {
        color: var(--new);
      }
    li.active a {
      color: var(--text);
    }
</style>
