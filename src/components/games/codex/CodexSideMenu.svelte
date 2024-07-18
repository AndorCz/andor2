<script>
  import { beforeUpdate, afterUpdate } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import { createSlug, updateURLParam, removeURLParam } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'
  import { showError, showSuccess } from '@lib/toasts'
  import Sortable from 'sortablejs'

  export let game
  export let pages
  export let activeSection
  export let activePage
  export let isStoryteller
  export let visiblePageCount = 0

  let pageListEl
  let isSortable = false
  let sorting = false
  let saving = false
  let showHandles = false

  beforeUpdate(() => {
    if (pages.length) {
      pages.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))
    }
  })

  afterUpdate(() => {
    if (pages.length && isSortable === false) {
      new Sortable(pageListEl, { animation: 150, handle: '.handle', onStart, onEnd })
      isSortable = true
    }
  })

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

  function onStart (event) {
    sorting = true
  }

  async function onEnd (sort) {
    sorting = false
    if (sort.oldIndex === sort.newIndex) { return }
    saving = true
    for (const [index, child] of Array.from(sort.from.children).entries()) {
      const pageId = child.dataset.id
      await updateIndex(pageId, index)
    }
    saving = false
  }

  async function updateIndex (pageId, newIndex) {
    const { error } = await supabase.from('codex_pages').update({ index: newIndex }).eq('id', pageId)
    if (error) { handleError(error) }
  }

  function activatePage (page) {
    activePage = page
    page ? updateURLParam('codex_page', page.slug) : removeURLParam('codex_page')
  }

  $: if (Array.isArray(pages)) {
    visiblePageCount = isStoryteller ? pages.length : pages.filter((p) => { return !p.hidden }).length
  }
</script>

<div class='menu' class:empty={visiblePageCount === 0}>
  {#if visiblePageCount > 0}
    <ul id='pageGeneral'>
      <li class:active={!activePage}>
        <button on:click={() => { activatePage(null) }} class='name plain'>Obecné</button>
      </li>
    </ul>
    <ul id='pageList' bind:this={pageListEl} class:showHandles class:saving>
      {#each pages as item}
        {#if !item.hidden || isStoryteller}
          <li class:active={item.id === activePage?.id} data-id={item.id}>
            <button on:click={() => { activatePage(item) }} class='name plain' class:hidden={item.hidden}>
              {#if item.hidden}<span class='material square' title='Hráčům skryté' use:tooltip>visibility_off</span>{/if}
              <span>{item.name}</span>
            </button>
            <svg class='handle' class:hidden={sorting} width='20px' height='20px' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'>
              <circle cx='12.5' cy='5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='12.5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='20' r='2.5' fill='currentColor'/>
            </svg>
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
  {#if isStoryteller}
    <div class='operations'>
      <button class='reorder' on:click={() => { showHandles = !showHandles }}>{showHandles ? 'Hotovo' : 'Přeřadit'}</button>
      <button on:click={addPage}>Přidat</button>
    </div>
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
      #pageGeneral {
        padding-bottom: 0px;
      }
      #pageList {
        padding-top: 0px;
      }
      ul.saving {
        opacity: 0.5;
        pointer-events: none;
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
        .showHandles {
          padding-left: 30px;
        }
        .showHandles .handle {
          display: block;
        }
        .handle {
          display: none;
          position: absolute;
          left: -20px;
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
      .operations {
        display: flex;
        justify-content: center;
        gap: 20px;
        padding-bottom: 20px;
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
