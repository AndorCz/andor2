<script>
  import { supabase, handleError } from '@lib/database'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import EditableLong from '@components/common/EditableLong.svelte'
  import CodexSideMenu from '@components/games/codex/CodexSideMenu.svelte'

  export let game
  export let user
  export let activeSection
  export let isStoryteller

  let pages = []
  let activePage

  async function loadData () {
    const { data: pagesData, error } = await supabase.from('codex_pages').select('*').match({ game: game.id, section: activeSection.id })
    if (error) { return handleError(error) }
    pages = pagesData

    const page = new URLSearchParams(window.location.search).get('codex_page')
    activePage = page ? pages.find((p) => { return p.slug === page }) || pages[0] : pages[0]
  }

  async function updatePage () {
    const { error } = await supabase.from('codex_pages').update({ content: activePage.content }).eq('id', activePage.id)
    if (error) { return handleError(error) }
  }

  function copyUrl () {
    navigator.clipboard.writeText(window.location)
    showSuccess('Cesta k této stránce byla vložena do schránky, můžeš jí vložit jinam')
  }

  $: if (activeSection) { loadData() }
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
        <p class='info'>V této sekci není žádný obsah</p>
      {/if}
    </div>
    {#if activePage}
      <footer>
        <div class='meta'>
          <table>
            <tr><td>Vytvořeno</td><td>{new Date(activePage.created_at).toLocaleDateString('cs')}</td></tr>
            <tr><td>Aktualizováno</td><td>{new Date(activePage.updated_at).toLocaleDateString('cs')}</td></tr>
          </table>
        </div>
        <div class='url'>{window.location}<button on:click={copyUrl} class='material square copy' title='zkopírovat' use:tooltip>content_copy</button></div>
      </footer>
    {/if}
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
      .content, .meta, .url {
        background-color: var(--block);
      }
      main p {
        padding: 10px 0px;
        margin: 0px;
      }
    aside {
      width: 220px;
    }
    .info {
      padding: 20px;
    }
  footer {
    margin-top: 40px;
    opacity: 0.5;
  }
    footer:hover {
      opacity: 1;
    }
    .meta {
      padding: 20px 0px;
    }
      footer table {
        border-spacing: 20px 0px;
      }
    .url {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--block);
      font-family: monospace;
      font-size: 14px;
      padding: 10px;
      margin-top: 10px;
      position: relative;
      border-radius: 10px;
    }
      .copy {
        position: absolute;
        right: 0px;
        top: 0px;
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
