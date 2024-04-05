<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import EditableLong from '@components/common/EditableLong.svelte'
  import CodexSideMenu from '@components/games/codex/CodexSideMenu.svelte'

  export let game
  export let user
  export let activeSection
  export let isStoryteller

  let pages = []
  let activePage

  onMount(async () => {
    await loadData()
    if (pages[0]) { activePage = pages[0] }
  })

  async function loadData () {
    const { data: pagesData, error } = await supabase.from('codex_pages').select('*').match({ game: game.id, section: activeSection.id })
    if (error) { return handleError(error) }
    pages = pagesData
  }

  async function updatePage () {
    const { error } = await supabase.from('codex_pages').update({ content: activePage.content }).eq('id', activePage.id)
    if (error) { return handleError(error) }
  }
</script>

<div class='wrapper'>
  <aside>
    <CodexSideMenu {game} {pages} {activeSection} bind:activePage />
  </aside>
  <main>
    <div class='content'>
      {#if activePage}
        <EditableLong userId={user.id} bind:value={activePage.content} onSave={updatePage} canEdit={isStoryteller} allowHtml />
      {:else}
        <p>V této sekci není žádný obsah</p>
      {/if}
    </div>
  </main>
</div>

<style>
  .wrapper {
    display: flex;
    gap: 10px;
  }
    main {
      flex: 1;
      line-height: 150%;
    }
      .content {
        background-color: var(--block);
      }
      main p {
        padding: 10px 0px;
        margin: 0px;
      }
    aside {
      width: 200px;
      background-color: var(--block);
    }
</style>
