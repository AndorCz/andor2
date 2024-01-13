<script>
  import { onMount } from 'svelte'
  import { sendPost } from '@lib/helpers'
  import { getBoardStore } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import Thread from '@components/common/Thread.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  export let data = {}

  const boardStore = getBoardStore(data.id)
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
</script>

<div class='headline'>
  <h2>{data.name}</h2>
  <button on:click={toggleHeader} class='material toggleHeader' class:active={!$boardStore.hideHeader} title={!$boardStore.hideHeader ? 'Skrýt nástěnku' : 'Zobrazit nástěnku'}>assignment</button>
  {#if isBoardOwner}
    <button on:click={showSettings} class='material settings' title='Nastavení'>settings</button>
  {/if}
</div>
{#if !$boardStore.hideHeader}
  <EditableLong bind:value={data.header} onSave={updateBoardHeader} canEdit={isBoardOwner} />
{/if}

<h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
<div class='addPostWrapper'>
  <TextareaExpandable allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton />
</div>

<Thread {posts} bind:page={page} {pages} onPaging={loadPosts} canDeleteAll={isBoardOwner} onDelete={deletePost} onEdit={triggerEdit} iconSize={70} myIdentities={[{ id: user.id }]} />

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
    h2 {
      margin: 0px;
      flex: 1;
    }
    .headline button {
      padding: 10px;
      margin-left: 10px;
    }
    .toggleHeader.active {
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
