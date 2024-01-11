<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { sendPost } from '@lib/helpers'
  import { showSuccess, showError } from '@lib/toasts'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  export let user = {}
  export let data = {}

  const isBoardOwner = data.owner.id === user.id

  let posts = []
  let textareaRef
  let textareaValue = ''
  let saving = false
  let editing = false
  let page = 0
  let pages

  const limit = 50

  onMount(() => { loadPosts() })

  async function loadPosts () {
    const { data: postData, count, error } = await supabase.from('posts_owner').select('id, owner, owner_name, owner_portrait, created_at, content', { count: 'exact' }).eq('thread', data.thread).order('created_at', { ascending: false }).range(page * limit, page * limit + limit - 1)
    if (error) { return handleError(error) }
    posts = postData
    pages = Math.ceil(count / limit)
  }

  async function submitPost () {
    saving = true
    if (editing) {
      await sendPost('PATCH', { id: editing, thread: data.thread, content: textareaValue, owner: user.id, ownerType: 'user' })
    } else {
      await sendPost('POST', { thread: data.thread, content: textareaValue, owner: user.id, ownerType: 'user' })
    }
    textareaValue = ''
    await loadPosts()
    saving = false
    editing = false
  }

  async function deletePost (id) {
    if (!window.confirm('Opravdu smazat příspěvek?')) { return }
    const res = await fetch(`/api/post?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    showSuccess('Příspěvek smazán')
    await loadPosts()
  }

  async function triggerEdit (id, content) {
    editing = id
    textareaValue = content
    textareaRef.triggerEdit(id, content)
    document.getElementsByClassName('content')[0].scrollIntoView({ behavior: 'smooth' })
    // saving is done in submitPost
  }
</script>

<h2>{data.name}</h2>

<h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
<div class='addPostWrapper'>
  <TextareaExpandable allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton />
</div>

<Thread {posts} bind:page={page} {pages} onPaging={loadPosts} canDeleteAll={isBoardOwner} onDelete={deletePost} onEdit={triggerEdit} iconSize={70} myIdentities={[{ id: user.id }]} />

<style>
  h2 {
    margin-top: 0px;
  }
  .addPostWrapper {
    display: flex;
    width: 100%;
    gap: 20px;
  }
</style>
