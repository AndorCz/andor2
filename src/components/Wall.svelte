<script>
  import { supabase, handleError } from '@lib/database-browser'
  import { isAdmin } from '@lib/admin'
  import { showSuccess } from '@lib/toasts'
  import { tooltip } from '@lib/tooltip'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import NewsItem from '@components/homepage/NewsItem.svelte'

  const { user = {}, items = [], page = 0, maxPage = 0, preview = false } = $props()

  let posts = $state(items || [])
  let textareaRef = $state()
  let textareaValue = $state('')
  let editing = $state(false)
  let saving = $state(false)

  function triggerPaging (newPage) {
    const params = new URLSearchParams(window.location.search)
    params.set('page', newPage)
    window.location = `/?${params.toString()}`
  }

  async function reload () {
    const limit = 5
    const query = supabase
      .from('wall_posts')
      .select('*')
      .eq('published', !preview)
      .order('created_at', { ascending: false })
      .range(page * limit, page * limit + limit - 1)
    const { data, error } = await query
    if (error) { return handleError(error) }
    posts = data || []
  }

  async function submitPost () {
    if (saving || !textareaValue.trim()) { return false }
    saving = true
    const functionName = editing ? 'update_wall_entry' : 'create_wall_entry'
    const params = editing
      ? { wall_id: editing, new_content: textareaValue }
      : { new_content: textareaValue, is_published: true }
    const { error } = await supabase.rpc(functionName, params)
    if (error) {
      saving = false
      return handleError(error)
    }
    textareaRef.clearContent()
    editing = false
    await reload()
    saving = false
    return true
  }

  function triggerEdit (item) {
    editing = item.wall_id
    textareaValue = item.content
    textareaRef.triggerEdit(item.wall_id, item.content)
    document.getElementById('wall-editor')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function deletePost (item) {
    if (!window.confirm('Opravdu smazat příspěvek ze zdi?')) { return }
    const { error } = await supabase.rpc('delete_wall_entry', { wall_id: item.wall_id })
    if (error) { return handleError(error) }
    showSuccess('Příspěvek smazán')
    await reload()
  }
</script>

<section id='wall'>
  {#if isAdmin(user)}
    <div id='wall-editor'>
      <h3>{editing ? 'Upravit příspěvek' : 'Přidat příspěvek'}</h3>
      <TextareaExpandable {user} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing showButton disableEmpty />
    </div>
  {/if}

  <h3 class='headline'>Upoutávky<a href='https://andor2.cz/board/35' class='material' title='Chceš propagovat hru, diskuzi, či dílo? Popiš svoji představu do diskuze "Zadání upoutávky", kam tě vezme kliknutí na tuto ikonku.' use:tooltip>info</a></h3>
  {#each posts as item (item.wall_id)}
    <div class='wall-entry'>
      {#if isAdmin(user)}
        <div class='admin-tools'>
          <button onclick={() => triggerEdit(item)} class='material' title='Upravit'>edit</button>
          <button onclick={() => deletePost(item)} class='material' title='Smazat'>delete</button>
        </div>
      {/if}
      <NewsItem {user} {item} />
    </div>
  {/each}
  <div class='pagination'>
    {#if page > 0}
      <button onclick={() => triggerPaging(page - 1)}>Novější</button>
    {/if}
    {#if page < maxPage}
      <button onclick={() => triggerPaging(page + 1)}>Starší</button>
    {/if}
  </div>
</section>

<style>
  #wall-editor {
    margin-bottom: 30px;
  }
  #wall-editor h3 {
    margin-top: 0px;
  }
  .headline {
    margin-top: 0px;
    display: flex;
    justify-content: space-between;
  }
  .wall-entry {
    position: relative;
  }
  .admin-tools {
    position: absolute;
    z-index: 2;
    right: 10px;
    top: 10px;
    display: flex;
  }
  .admin-tools button {
    padding: 5px;
    background: none;
    border: none;
    box-shadow: none;
    color: var(--dim);
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 40px;
  }
</style>
