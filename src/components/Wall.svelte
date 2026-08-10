<script>
  import { supabase, handleError } from '@lib/database-browser'
  import { showSuccess } from '@lib/toasts'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  const { user = {}, items = [], page = 0, maxPage = 0 } = $props()

  const limit = 5
  const myIdentities = user.id ? [{ id: user.id }] : []
  let posts = $state(items || [])
  let textareaRef = $state()
  let textareaValue = $state('')
  let editing = $state(false)
  let editingPost = $state()
  let saving = $state(false)
  let loading = $state(false)
  let currentPage = $state(page)
  let pages = $state(maxPage + 1)

  function updatePageUrl (newPage) {
    const params = new URLSearchParams(window.location.search)
    if (newPage > 0) { params.set('wallPage', newPage) } else { params.delete('wallPage') }
    window.history.replaceState({}, '', `/?${params.toString()}`)
  }

  async function loadPosts (newPage = currentPage) {
    loading = true
    const { data: wallThreads, error: wallError, count } = await supabase
      .from('wall')
      .select('id', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(newPage * limit, newPage * limit + limit - 1)
    if (wallError) {
      loading = false
      return handleError(wallError)
    }

    const wallIds = (wallThreads || []).map(thread => thread.id)
    let data = []
    if (wallIds.length) {
      const { data: wallPosts, error: postsError } = await supabase
        .from('wall_posts')
        .select('*')
        .in('wall_id', wallIds)
        .order('wall_created_at', { ascending: false })
        .order('position', { ascending: true })
      if (postsError) {
        loading = false
        return handleError(postsError)
      }
      data = wallPosts
    }

    posts = data
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
    await loadPosts(wasEditing ? currentPage : 0)
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
    await loadPosts(currentPage)
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
    const threadCount = new Set(posts.map(item => item.wall_id)).size
    const nextPage = post.position === 1 && threadCount === 1 && currentPage > 0 ? currentPage - 1 : currentPage
    await loadPosts(nextPage)
  }
</script>

<section id='wall'>
  {#if user.id}
    <div id='wall-editor'>
      <TextareaExpandable {user} allowHtml forceBubble minHeight={50} placeholder='Napiš něco na zeď…' bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing showButton disableEmpty />
    </div>
  {/if}

  <Thread type='wall' id={null} {loading} {posts} {user} bind:page={currentPage} pages={pages > 1 ? pages : null} allowReactions onPaging={loadPosts} onCreateReply={submitReply} {myIdentities} onDelete={deletePost} onEdit={triggerEdit} />
</section>

<style>
  #wall-editor {
    margin-bottom: 20px;
  }
</style>
