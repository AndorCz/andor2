<script>
  import { writable } from 'svelte/store'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database-browser'
  import EditableLong from '@components/common/EditableLong.svelte'
  import CodexSideMenu from '@components/games/codex/CodexSideMenu.svelte'
  import CodexPage from '@components/games/codex/CodexPage.svelte'

  export let game
  export let user
  export let activeSection
  export let isStoryteller

  let pages = []
  let activePage
  let visiblePageCount = 0

  const mentionList = writable([])
  $mentionList = game.characters.filter((char) => { return char.accepted && char.state === 'alive' }).map((char) => { return { name: char.name, id: char.id } })

  async function loadData () {
    const { data: pagesData, error } = await supabase.from('codex_pages').select('*').match({ game: game.id, section: activeSection.id })
    if (error) { return handleError(error) }
    pages = pagesData

    const page = new URLSearchParams(window.location.search).get('codex_page')
    activePage = page ? pages.find((p) => { return p.slug === page }) || null : null
  }

  async function updateSection () {
    const { error } = await supabase.from('codex_sections').update({ content: activeSection.content }).eq('id', activeSection.id)
    if (error) { return handleError(error) }
    showSuccess('Sekce byla aktualizována')
  }

  async function onPageChange () {
    await loadData()
  }

  $: if (activeSection) { loadData() }
</script>

<div class='wrapper' class:empty={visiblePageCount === 0}>
  <aside>
    <CodexSideMenu {game} {pages} {activeSection} {isStoryteller} bind:activePage bind:visiblePageCount />
  </aside>
  <main>
    {#if activePage}
      {#if (!activePage.hidden || isStoryteller)}
        <CodexPage {user} {game} {isStoryteller} page={activePage} {onPageChange} />
      {:else}
        <div class='content'><p class='info'>Tato stránka je skrytá</p></div>
      {/if}
    {:else}
      <!-- Base section content -->
      <div class='content'>
        <EditableLong fonts={game.fonts} {user} bind:value={activeSection.content} onSave={updateSection} canEdit={isStoryteller} {mentionList} allowHtml />
      </div>
    {/if}
  </main>
</div>

<style>
  .wrapper {
    display: flex;
    gap: 10px;
  }
    .wrapper.empty {
      flex-direction: column-reverse;
      gap: 40px;
    }
      .wrapper.empty aside {
        width: 100%;
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
      width: 300px;
    }
    .info {
      padding: 20px;
    }

  @media (max-width: 700px) {
    .wrapper {
      flex-direction: column-reverse;
    }
      aside {
        margin-top: 30px;
        width: 100%;
      }
  }
</style>
