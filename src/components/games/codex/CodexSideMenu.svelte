<script>
  import { supabase, handleError } from '@lib/database'

  export let game
  export let pages
  export let activeSection
  export let activePage

  async function addPage () {
    const name = prompt('Název nové stránky')
    if (!name) { return }
    const { data, error } = await supabase.from('codex_pages').insert({ game: game.id, section: activeSection.id, name, content: `<h1>${name}</h1>` }).select()
    if (error) { return handleError(error) }
    pages = [...pages, data[0]]
    activePage = data[0]
  }
</script>

<ul>
  {#if activePage && Array.isArray(pages)}
    {#each pages as item}
      <li class:active={item.id === activePage.id}><button on:click={() => { activePage = item }} class='plain'>{item.name}</button></li>
    {/each}
  {/if}
  <li class='add'><button on:click={addPage}>Přidat stránku</button></li>
</ul>

<style>
  ul {
    list-style-type: none;
    padding: 0px;
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
      padding: 10px 20px;
      color: var(--link);
    }
      li.active button {
        color: var(--text);
      }
    .add {
      margin-top: 20px;
      text-align: center;
    }
</style>
