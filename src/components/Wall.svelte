<script>
  import { supabase, handleError } from '@lib/database-browser'
  import { showSuccess } from '@lib/toasts'
  import { onMount } from 'svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'
  import WallEvent from '@components/homepage/WallEvent.svelte'

  const { user = {}, items = [], page = 0, maxPage = 0, onRead = null } = $props()

  const limit = 5
  const myIdentities = user.id ? [{ id: user.id }] : []
  let entries = $state(items || [])
  let wallElement = $state()
  let textareaRef = $state()
  let textareaValue = $state('')
  let editing = $state(false)
  let editingPost = $state()
  let saving = $state(false)
  let loading = $state(false)
  let currentPage = $state(page)
  let pages = $state(maxPage + 1)

  onMount(async () => {
    if (!user.id) { return }
    const { error } = await supabase.rpc('wall_read')
    if (error) { return handleError(error) }
    onRead?.()
  })

  function updatePageUrl (newPage) {
    const params = new URLSearchParams(window.location.search)
    if (newPage > 0) { params.set('wallPage', newPage) } else { params.delete('wallPage') }
    window.history.replaceState({}, '', `/?${params.toString()}`)
  }

  function addPostsToEntries (wallEntries, wallPosts) {
    return (wallEntries || []).map(entry => ({
      ...entry,
      posts: entry.entry_type === 'thread'
        ? wallPosts.filter(post => post.wall_id === entry.id)
        : []
    }))
  }

  async function loadEntries (newPage = currentPage) {
    loading = true
    const { data: wallEntries, error: wallError, count } = await supabase
      .from('wall')
      .select('*, author:profiles!wall_author_id_fkey(id, name, portrait)', { count: 'exact' })
      .eq('published', true)
      .order('activity_at', { ascending: false })
      .order('id', { ascending: false })
      .range(newPage * limit, newPage * limit + limit - 1)
    if (wallError) {
      loading = false
      return handleError(wallError)
    }

    const threadIds = (wallEntries || []).filter(entry => entry.entry_type === 'thread').map(entry => entry.id)
    let wallPosts = []
    if (threadIds.length) {
      const { data: postsData, error: postsError } = await supabase
        .from('wall_posts')
        .select('*')
        .in('wall_id', threadIds)
        .order('position', { ascending: true })
      if (postsError) {
        loading = false
        return handleError(postsError)
      }
      wallPosts = postsData || []
    }

    entries = addPostsToEntries(wallEntries, wallPosts)
    pages = Math.max(1, Math.ceil(count / limit))
    currentPage = newPage
    updatePageUrl(newPage)
    loading = false
  }

  async function submitPost () {
    if (saving || !textareaValue.trim()) { return false }
    saving = true
    const activeEditingPost = editing ? editingPost : null
    const wasEditing = Boolean(activeEditingPost)
    const result = activeEditingPost?.position > 1
      ? await supabase.from('posts').update({ content: textareaValue }).eq('id', activeEditingPost.id)
      : await supabase.rpc(
        activeEditingPost ? 'update_wall_entry' : 'create_wall_entry',
        activeEditingPost
          ? { wall_id: activeEditingPost.wall_id, new_content: textareaValue }
          : { new_content: textareaValue, is_published: true }
      )
    const { error } = result
    if (error) {
      saving = false
      return handleError(error)
    }
    textareaRef.clearContent()
    editing = false
    editingPost = null
    await loadEntries(wasEditing ? currentPage : 0)
    saving = false
    return true
  }

  function triggerEdit (post) {
    editingPost = post
    editing = post.id
    textareaValue = post.content
    textareaRef.triggerEdit(post.id, post.content)
    document.getElementById('wall-editor')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function submitReply (post, content) {
    const { error } = await supabase.rpc('create_wall_reply', { target_wall_id: post.wall_id, new_content: content })
    if (error) {
      handleError(error)
      return false
    }
    await loadEntries(currentPage)
    return true
  }

  async function deletePost (post) {
    if (!window.confirm('Opravdu smazat příspěvek ze zdi?')) { return }
    const result = post.position > 1
      ? await supabase.from('posts').delete().eq('id', post.id)
      : await supabase.rpc('delete_wall_entry', { wall_id: post.wall_id })
    const { error } = result
    if (error) { return handleError(error) }
    showSuccess('Příspěvek smazán')
    const nextPage = post.position === 1 && entries.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage
    await loadEntries(nextPage)
  }

  async function changePage (newPage) {
    await loadEntries(newPage)
    wallElement?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<section id='wall' bind:this={wallElement}>
  {#if user.id}
    <div id='wall-editor'>
      <TextareaExpandable {user} allowHtml forceBubble minHeight={50} placeholder='Napiš něco na zeď…' bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing showButton disableEmpty />
    </div>
  {/if}

  {#if loading}
    <p class='info'>Načítám zeď…</p>
  {:else if entries.length}
    {#each entries as entry (entry.id)}
      {#if entry.entry_type === 'event'}
        <WallEvent item={entry} />
      {:else}
        <Thread type='wall' id={null} loading={false} posts={entry.posts} {user} enableAutorefresh={false} allowReactions onCreateReply={submitReply} {myIdentities} onDelete={deletePost} onEdit={triggerEdit} />
      {/if}
    {/each}
    {#if pages > 1}
      <div class='pagination'>
        {#each { length: pages } as _, i (i)}
          <button onclick={() => changePage(i)} disabled={i === currentPage}>{i + 1}</button>
        {/each}
      </div>
    {/if}
  {:else}
    <center>Žádné příspěvky</center>
  {/if}
</section>

<style>
  #wall-editor {
    margin-bottom: 20px;
  }
  .info {
    margin: 60px 0px;
    text-align: center;
  }
  center {
    margin-top: 30px;
  }
  .pagination {
    margin-top: 70px;
    text-align: left;
  }
    .pagination button {
      width: 40px;
      height: 40px;
      margin: 5px;
      padding: 0px;
      font-size: 22px;
    }
</style>
