<script>
  import { supabase, handleError } from '@lib/database'
  import { createSlug, updateURLParam } from '@lib/utils'

  export let game
  export let pages
  export let activeSection
  export let activePage = pages[0]

  async function addPage () {
    const name = prompt('Název nové stránky')
    if (!name) { return }
    const slug = createSlug(name)
    const { data, error } = await supabase.from('codex_pages').insert({ game: game.id, slug, section: activeSection.id, name, content: `<h1>${name}</h1>` }).select()
    if (error) { return handleError(error) }
    pages = [...pages, data[0]]
    activePage = data[0]
  }

  function activate (page) {
    activePage = page
    updateURLParam('codex_page', page.slug)
  }
</script>

<div class='menu'>
  <ul>
    {#if activePage && Array.isArray(pages)}
      {#each pages as item}
        <li class:active={item.id === activePage.id}><button on:click={() => { activate(item) }} class='plain'>{item.name}</button></li>
      {/each}
    {/if}
  </ul>
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
      }
      button.plain {
        display: block;
        width: 100%;
        height: 100%;
        text-align: left;
        padding: 5px 0px;
        color: var(--link);
      }
        li.active button {
          color: var(--text);
        }
      .add {
        padding: 20px;
        padding-top: 0px;
        text-align: center;
      }

  @media (max-width: 700px) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
