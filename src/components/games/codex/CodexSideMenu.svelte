<script>
  import { supabase, handleError } from '@lib/database'
  import { createSlug, updateURLParam } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'
  import { showError, showSuccess } from '@lib/toasts'

  export let game
  export let pages
  export let activeSection
  export let activePage
  export let isStoryteller

  let activeOptionsPage
  let visiblePageCount = 0

  async function addPage () {
    const name = window.prompt('Název nové stránky').trim()
    if (!name) { return showError('Název nesmí být prázdný') }
    const slug = createSlug(name)
    const { data, error } = await supabase.from('codex_pages').insert({ game: game.id, slug, section: activeSection.id, name, content: `<h1>${name}</h1>` }).select()
    if (error) { return handleError(error) }
    pages = [...pages, data[0]]
    activePage = data[0]
  }

  async function renamePage () {
    const name = window.prompt('Nový název stránky', activeOptionsPage.name).trim()
    if (!name) { return showError('Název nesmí být prázdný') }
    const slug = createSlug(name)
    const { error } = await supabase.from('codex_pages').update({ name, slug }).eq('id', activeOptionsPage.id)
    if (error) { return handleError(error) }
    activeOptionsPage.name = name
    activeOptionsPage.slug = slug
    pages = pages // update svelte
    activeOptionsPage = null
    showSuccess('Název byl změněn')
  }

  async function deletePage () {
    if (!confirm(`Opravdu chceš smazat stránku "${activeOptionsPage.name}"?`)) { return }
    const { error } = await supabase.from('codex_pages').delete().eq('id', activeOptionsPage.id)
    if (error) { return handleError(error) }
    pages = pages.filter((p) => { return p.id !== activeOptionsPage.id })
    activePage = pages[0]
    showSuccess('Stránka byla smazána')
    activeOptionsPage = null
  }

  async function togglePage () {
    const { error } = await supabase.from('codex_pages').update({ hidden: !activeOptionsPage.hidden }).eq('id', activeOptionsPage.id)
    if (error) { return handleError(error) }
    activeOptionsPage.hidden = !activeOptionsPage.hidden
    pages = pages // update svelte
    showSuccess('Stránka byla ' + (activeOptionsPage.hidden ? 'skryta' : 'zobrazena'))
    activeOptionsPage = null
  }

  function activatePage (page) {
    activePage = page
    updateURLParam('codex_page', page.slug)
  }

  function toggleOptions (page) {
    activeOptionsPage = activeOptionsPage && activeOptionsPage.id === page.id ? null : page
  }

  function hideOptions (event) {
    if (activeOptionsPage && !event.target.closest('.options') && !event.target.closest('.edit')) {
      activeOptionsPage = null
    }
  }

  $: if (Array.isArray(pages)) {
    visiblePageCount = isStoryteller ? pages.length : pages.filter((p) => { return !p.hidden }).length
  }
</script>

<svelte:window on:click={hideOptions} />

<div class='menu'>
  {#if activePage && visiblePageCount}
    <ul>
      {#each pages as item}
        {#if !item.hidden || isStoryteller}
          <li class:active={item.id === activePage.id}>
            <button on:click={() => { activatePage(item) }} class='name plain'>
              {#if item.hidden}<span class='material square' title='Hráčům skryté' use:tooltip>visibility_off</span>{/if}
              <span>{item.name}</span>
            </button>
            {#if activeOptionsPage && activeOptionsPage.id === item.id}
              <div class='options'>
                <button on:click={renamePage} class='material square rename' title='Přejmenovat' use:tooltip>edit</button>
                <button on:click={togglePage} class='material square toggle' title={activeOptionsPage.hidden ? 'Zobrazit' : ' Skrýt'} use:tooltip>{activeOptionsPage.hidden ? 'visibility' : ' visibility_off'}</button>
                <button on:click={deletePage} class='material square delete' title='Smazat' use:tooltip>delete</button>
              </div>
            {/if}
            <span class='edit'>
              <button on:click={() => { toggleOptions(item) }} class:active={activeOptionsPage && activeOptionsPage.id === item.id} class='material square edit'>edit</button>
            </span>
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
  <div class='add'><button on:click={addPage}>Přidat stránku</button></div>
</div>

<style>
  .menu {
    background-color: var(--block);
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
        .edit {
          position: absolute;
          top: 0px;
          right: 0px;
        }
          .edit button {
            display: none;
            padding: 10px;
          }
            .edit button.active {
              display: inline-flex;
            }
          li:hover .edit {
            display: block;
          }
        .options {
          position: absolute;
          top: 0px;
          right: 50px;
          z-index: 999;
        }
      .add {
        padding: 20px;
        text-align: center;
      }

  @media (max-width: 700px) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
