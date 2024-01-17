<script>
  import { onMount } from 'svelte'
  import { sendPost } from '@lib/helpers'
  import { posts, getBoardStore, bookmarks } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { platform } from '@components/common/MediaQuery.svelte'
  import Thread from '@components/common/Thread.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  export let data = {}

  const boardStore = getBoardStore(data.id)
  const isBoardOwner = data.owner.id === user.id
  let bookmarkId

  let textareaRef
  let textareaValue = ''
  let saving = false
  let editing = false
  let page = 0
  let pages

  const limit = 50

  onMount(() => { loadPosts() })

  async function loadPosts () {
    const { data: postData, count, error } = await supabase.from('posts_owner').select('id, owner, owner_name, owner_portrait, created_at, content, moderated, thumbs, hearts, frowns, laughs', { count: 'exact' }).eq('thread', data.thread).order('created_at', { ascending: false }).range(page * limit, page * limit + limit - 1)
    if (error) { return handleError(error) }
    $posts = postData
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

  async function moderatePost (id) {
    if (!window.confirm('Opravdu skrýt příspěvek všem? (moderovat)')) { return }
    const res = await fetch('/api/post', { method: 'PATCH', body: JSON.stringify({ id, moderate: true }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    showSuccess('Příspěvek skryt všem')
    await loadPosts()
  }

  async function triggerEdit (id, content) {
    editing = id
    textareaValue = content
    textareaRef.triggerEdit(id, content)
    document.getElementsByClassName('text')[0].scrollIntoView({ behavior: 'smooth' })
    // saving is done in submitPost
  }

  function toggleHeader () {
    $boardStore.hideHeader = !$boardStore.hideHeader
  }

  async function updateBoardHeader () {
    const { error } = await supabase.from('boards').update({ header: data.header }).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  async function addBookmark () {
    const { data: newBookmark, error } = await supabase.from('bookmarks').insert({ user_id: user.id, board_id: data.id }).select().single()
    if (error) { return handleError(error) }
    $bookmarks.boards = [...$bookmarks.boards, { id: newBookmark.id, board: { id: data.id, name: data.name } }]
    showSuccess('Záložka přidána')
  }

  async function removeBookmark () {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) { return handleError(error) }
    $bookmarks.boards = $bookmarks.boards.filter(b => b.board.id !== data.id)
    showSuccess('Záložka odebrána')
  }

  $: bookmarkId = $bookmarks.boards?.find(b => b.board.id === data.id)?.id
</script>

<div class='headline'>
  <h1>{data.name}</h1>
  <button on:click={toggleHeader} class='material toggleHeader' class:active={!$boardStore.hideHeader} title={!$boardStore.hideHeader ? 'Skrýt nástěnku' : 'Zobrazit nástěnku'}>assignment</button>
  {#if user.id}
    <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark' class:active={bookmarkId} title='Sledovat'>bookmark</button>
    {#if isBoardOwner}
      <button on:click={showSettings} class='material settings' title='Nastavení'>settings</button>
    {/if}
  {/if}
</div>

{#if !$boardStore.hideHeader}
  <EditableLong bind:value={data.header} onSave={updateBoardHeader} canEdit={isBoardOwner} />
{/if}

{#if user.id}
  <h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
  <div class='addPostWrapper'>
    <TextareaExpandable allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton />
  </div>
{/if}

<Thread {posts} bind:page={page} {pages} allowReactions onPaging={loadPosts} canModerate={isBoardOwner} onModerate={moderatePost} onDelete={deletePost} onEdit={triggerEdit} iconSize={$platform === 'desktop' ? 70 : 40} myIdentities={[{ id: user.id }]} />

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
    h1 {
      margin: 0px;
      flex: 1;
    }
    .headline button {
      padding: 10px;
      margin-left: 10px;
    }
    .headline button.active {
      background-color: var(--panel);
      border: 1px var(--panel) solid;
      box-shadow: inset 2px 2px 2px #0003;
    }

  .addPostWrapper {
    display: flex;
    width: 100%;
    gap: 20px;
  }
</style>
