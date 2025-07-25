<script>
  import { onMount } from 'svelte'
  import { bookmarks } from '@lib/stores'
  import { supabase, handleError } from '@lib/database-browser'
  import Sortable from 'sortablejs'

  let soloEl = $state()
  let gamesEl = $state()
  let boardsEl = $state()
  let worksEl = $state()
  let sorting = $state(false)
  let saving = $state(false)
  let showHandles = $state(false)
  const bookmarkNumber = $derived(($bookmarks.games?.length || 0) + ($bookmarks.boards?.length || 0) + ($bookmarks.works?.length || 0))

  if ($bookmarks.solo) $bookmarks.solo.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))
  if ($bookmarks.games) $bookmarks.games.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))
  if ($bookmarks.boards) $bookmarks.boards.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))
  if ($bookmarks.works) $bookmarks.works.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))

  onMount(() => {
    if ($bookmarks.games?.length) {
      new Sortable(gamesEl, { animation: 150, handle: '.handle', group: { name: 'games', pull: false }, onStart: sortStart, onEnd: (sort) => sortEnd('games', sort) })
    }
    if ($bookmarks.boards?.length) {
      new Sortable(boardsEl, { animation: 150, handle: '.handle', group: { name: 'boards', pull: false }, onStart: sortStart, onEnd: (sort) => sortEnd('boards', sort) })
    }
    if ($bookmarks.works?.length) {
      new Sortable(worksEl, { animation: 150, handle: '.handle', group: { name: 'works', pull: false }, onStart: sortStart, onEnd: (sort) => sortEnd('works', sort) })
    }
  })

  function sortStart (event) { sorting = true }

  async function sortEnd (type, sort) {
    sorting = false
    if (sort.oldIndex === sort.newIndex) { return }
    saving = true
    for (const [index, child] of Array.from(sort.from.children).entries()) {
      const bookmarkId = child.dataset.id
      await updateIndex(bookmarkId, index)
    }
    saving = false
  }

  async function updateIndex (bookmarkId, newIndex) {
    const { error } = await supabase.from('bookmarks').update({ index: newIndex }).eq('id', bookmarkId)
    if (error) { handleError(error) }
  }
</script>

{#if $bookmarks.games.length > 0}
  <a href='/games'><h4>Hry</h4></a>
  <ul class='games' bind:this={gamesEl} class:saving class:showHandles>
    {#each $bookmarks.games as bookmark (bookmark.id)}
      <li class='bookmark' class:active={'/game/' + bookmark.id === window.location.pathname} data-id={bookmark.bookmark_id}>
        <a href={'/game/' + bookmark.id + '?tab=game'}>
          {bookmark.name}
          {#if (bookmark.unread_game || bookmark.unread_discussion) && window.location.pathname !== '/game/' + bookmark.id}
            <span class='unread'>{bookmark.unread_game} | {bookmark.unread_discussion}</span>
          {/if}
        </a>
        <svg class='handle' class:hidden={sorting} width='20px' height='20px' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='12.5' cy='5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='12.5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='20' r='2.5' fill='currentColor'/>
        </svg>
      </li>
    {/each}
  </ul>
{/if}

{#if $bookmarks.solo.length > 0}
  <hr>
  <a href='/solo'><h4>Sólo</h4></a>
  <ul class='solo' bind:this={soloEl} class:saving class:showHandles>
    {#each $bookmarks.solo as bookmark (bookmark.id)}
      <li class='bookmark' class:active={'/solo/game/' + bookmark.id === window.location.pathname} data-id={bookmark.bookmark_id}>
        <a href={'/solo/game/' + bookmark.id}>{bookmark.name}</a>
        <svg class='handle' class:hidden={sorting} width='20px' height='20px' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='12.5' cy='5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='12.5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='20' r='2.5' fill='currentColor'/>
        </svg>
      </li>
    {/each}
  </ul>
{/if}

{#if $bookmarks.boards.length > 0}
  <hr>
  <a href='/boards'><h4>Diskuze</h4></a>
  <ul class='boards' bind:this={boardsEl} class:saving class:showHandles>
    {#each $bookmarks.boards as bookmark (bookmark.id)}
      <li class='bookmark' class:active={'/board/' + bookmark.id === window.location.pathname} data-id={bookmark.bookmark_id}>
        <a href={'/board/' + bookmark.id}>
          {bookmark.name}
          {#if bookmark.unread && window.location.pathname !== '/board/' + bookmark.id}
            <span class='unread'>{bookmark.unread}</span>
          {/if}
        </a>
        <svg class='handle' class:hidden={sorting} width='20px' height='20px' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='12.5' cy='5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='12.5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='20' r='2.5' fill='currentColor'/>
        </svg>
      </li>
    {/each}
  </ul>
{/if}

{#if $bookmarks.works.length > 0}
  <hr>
  <a href='/works'><h4>Tvorba</h4></a>
  <ul class='works' bind:this={worksEl} class:saving class:showHandles>
    {#each $bookmarks.works as bookmark (bookmark.id)}
      <li class='bookmark' class:active={'/work/' + bookmark.id === window.location.pathname} data-id={bookmark.bookmark_id}>
        <a href={'/work/' + bookmark.id}>
          {bookmark.name}
          {#if bookmark.unread && window.location.pathname !== '/work/' + bookmark.id}
            <span class='unread'>{bookmark.unread}</span>
          {/if}
        </a>
        <svg class='handle' class:hidden={sorting} width='20px' height='20px' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='12.5' cy='5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='12.5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='20' r='2.5' fill='currentColor'/>
        </svg>
      </li>
    {/each}
  </ul>
{/if}

{#if bookmarkNumber === 0}
  <div class='empty'>Žádné záložky</div>
{:else}
  <button class='reorder' onclick={() => { showHandles = !showHandles }}>{showHandles ? 'Hotovo' : 'Přeřadit'}</button>
{/if}

<style>
  .saving {
    opacity: 0.5;
    pointer-events: none;
  }
  .reorder {
    margin: auto;
    display: block;
  }
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
  hr {
    margin: 20px -20px;
    border: none;
    border-top: 1px solid var(--background);
  }
  h4 {
    color: var(--dim);
    font-size: 18px;
    margin: 0px;
  }
  ul {
    list-style: none;
    margin: 10px 0px;
    margin-bottom: 15px;
    padding: 0px;
    padding-left: 10px;
  }
    li {
      position: relative;
      padding: 4px 0px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      overflow-wrap: anywhere;
    }
      li a {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 19px;
        font-variation-settings: 'wght' 500;
      }
        .unread {
          color: var(--new);
          white-space: nowrap;
        }
        li.active a {
          color: var(--text);
        }
        .showHandles .handle {
          display: block;
        }
        .handle {
          display: none;
          position: absolute;
          left: -25px;
          top: 8px;
          cursor: grab;
          color: var(--text);
          opacity: 0.3;
          min-width: 5px;
          min-height: 20px;
        }
          .handle:hover {
            opacity: 1;
          }
          .handle.hidden {
            display: none;
          }
</style>
