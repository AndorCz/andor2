<script>
  import { supabase, handleError } from '@lib/database-browser'
  import { createSlug, updateURLParam, removeURLParam } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'
  import { showError, showSuccess } from '@lib/toasts'

  export let game
  export let pages
  export let activeSection
  export let activePage
  export let isStoryteller
  export let visiblePageCount = 0

  async function addPage () {
    const name = window.prompt('Název nové stránky').trim()
    if (!name) { return showError('Název nesmí být prázdný') }
    const slug = createSlug(name)
    const { data, error } = await supabase.from('codex_pages').insert({ game: game.id, slug, section: activeSection.id, name, content: `<h1>${name}</h1>` }).select()
    if (error) { return handleError(error) }
    pages = [...pages, data[0]]
    activePage = data[0]
    updateURLParam('codex_page', activePage.slug)
    showSuccess('Stránka byla přidána')
  }

  function activatePage (page) {
    activePage = page
    page ? updateURLParam('codex_page', page.slug) : removeURLParam('codex_page')
  }

  $: if (Array.isArray(pages)) {
    visiblePageCount = isStoryteller ? pages.length : pages.filter((p) => { return !p.hidden }).length
    pages.sort((a, b) => a.name.localeCompare(b.name)) // sort pages by name
  }
</script>

<div class='menu' class:empty={visiblePageCount === 0}>
  {#if visiblePageCount > 0}
    <ul>
      <li class:active={!activePage}>
        <button on:click={() => { activatePage(null) }} class='name plain'>Obecné</button>
      </li>
      {#each pages as item}
        {#if !item.hidden || isStoryteller}
          <li class:active={item.id === activePage?.id}>
            <button on:click={() => { activatePage(item) }} class='name plain' class:hidden={item.hidden}>
              {#if item.hidden}<span class='material square' title='Hráčům skryté' use:tooltip>visibility_off</span>{/if}
              <span>{item.name}</span>
            </button>
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
  {#if isStoryteller}
    <div class='add'><button on:click={addPage}>Přidat podstránku</button></div>
  {/if}
</div>

<style>
  .menu {
    background-color: var(--block);
  }
    .menu.empty {
      background-color: transparent;
    }
    ul {
      list-style-type: none;
      margin: 0px;
      padding: 20px;
      width: 100%;
    }
      li {
        margin: 0px;
        padding: 0px;
        height: 40px;
        position: relative;
      }
        .name {
          display: flex;
          align-items: center;
          gap: 5px;
          width: 100%;
          height: 100%;
          text-align: left;
          padding: 5px 0px;
          color: var(--link);
        }
          .name:hover {
            color: var(--maximum);
          }
        li.active button {
          color: var(--text) !important;
        }
        li .material {
          font-size: 18px;
        }
      .add {
        padding: 20px;
        text-align: center;
      }
      .hidden {
        color: var(--dim);
      }

  @media (max-width: 700px) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
