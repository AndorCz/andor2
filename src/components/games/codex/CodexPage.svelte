<script>
  import { showSuccess, showError } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database-browser'
  import { formatDate, createSlug, updateURLParam, removeURLParam } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'
  import EditableLong from '@components/common/EditableLong.svelte'

  const { user, game, page, isStoryteller, onPageChange } = $props()

  const mentionList = $derived(game.characters.filter(char => char.accepted && char.state === 'alive').map(char => ({ name: char.name, type: 'character', id: char.id })))

  async function updatePage () {
    const { error } = await supabase.from('codex_pages').update({ content: page.content }).eq('id', page.id)
    if (error) { return handleError(error) }
    showSuccess('Stránka byla aktualizována')
  }

  async function renamePage () {
    const name = window.prompt('Nový název stránky', page.name).trim()
    if (!name) { return showError('Název nesmí být prázdný') }
    const slug = createSlug(name)
    const { error } = await supabase.from('codex_pages').update({ name, slug }).eq('id', page.id)
    if (error) { return handleError(error) }
    page.name = name
    page.slug = slug
    updateURLParam('codex_page', page.slug)
    showSuccess('Název byl změněn')
    onPageChange()
  }

  async function deletePage () {
    if (!confirm(`Opravdu chceš smazat stránku "${page.name}"?`)) { return }
    const { error } = await supabase.from('codex_pages').delete().eq('id', page.id)
    if (error) { return handleError(error) }
    removeURLParam('codex_page')
    showSuccess('Stránka byla smazána')
    onPageChange()
  }

  async function togglePage () {
    const { error } = await supabase.from('codex_pages').update({ hidden: !page.hidden }).eq('id', page.id)
    if (error) { return handleError(error) }
    page.hidden = !page.hidden
    showSuccess('Stránka byla ' + (page.hidden ? 'skryta' : 'zobrazena'))
    onPageChange()
  }

  function copyUrl () {
    navigator.clipboard.writeText(window.location)
    showSuccess('Cesta k této stránce byla vložena do schránky, můžeš jí vložit jinam')
  }
</script>

<div class='content'>
  <EditableLong {user} bind:value={page.content} onSave={updatePage} canEdit={isStoryteller} {mentionList} fonts={game.fonts} allowHtml />
</div>
<footer>
  <div class='meta'>
    <table>
      <tbody>
        <tr><td>Vytvořeno</td><td>{formatDate(page.created_at)}</td></tr>
        <tr><td>Aktualizováno</td><td>{formatDate(page.updated_at)}</td></tr>
      </tbody>
    </table>
  </div>
  <div class='url'>{#key page.slug}{window.location}{/key}<button on:click={copyUrl} class='material square copy' title='Zkopírovat cestu' use:tooltip>content_copy</button></div>
  {#if isStoryteller}
    <div class='options'>
      <button on:click={renamePage} class='rename'><span class='material'>edit</span>Přejmenovat</button>
      <button on:click={togglePage} class='toggle'><span class='material'>{page.hidden ? 'visibility' : ' visibility_off'}</span>{page.hidden ? 'Zobrazit' : ' Skrýt'}</button>
      <button on:click={deletePage} class='delete'><span class='material'>delete</span>Smazat</button>
    </div>
  {/if}
</footer>

<style>
  footer {
    margin-top: 40px;
  }
    footer:hover {
      opacity: 1;
    }
    .meta, .url {
      background-color: var(--block);
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
      overflow-wrap: break-word;
      word-break: break-word;
      width: auto;
    }
      .copy {
        position: absolute;
        right: 0px;
        top: 0px;
      }
    .options {
      margin-top: 10px;
      display: flex;
      gap: 10px;
    }
      .options button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
      }
</style>
