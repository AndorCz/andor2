<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, sendPost } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { getSavedStore, posts } from '@lib/stores'
  import { platform } from '@components/common/MediaQuery.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  export let user = {}
  export let data = {}
  export let isOwner
  export let slug
  export let isPermitted = true
  export let thread
  export let unread = 0
  export let useIdentities = false
  export let identityStore = null

  const limit = 50
  const showDiscussion = data.open_discussion || isPermitted
  const discussionStore = getSavedStore(slug)

  let textareaRef
  let textareaValue = $discussionStore.unsent || '' // load unsent post
  let identitySelect
  let saving = false
  let editing = false
  let page = 0
  let pages

  // set identities for discussion
  const getMyCharacters = () => {
    if (!useIdentities || !showDiscussion) { return [] }
    const myCharacters = data.characters.filter((char) => { return char.player?.id === user.id })
    myCharacters.forEach((char) => { char.type = 'character' })
    return myCharacters
  }
  const userIdentity = { name: user.name, id: user.id, type: 'user' }
  const identities = [userIdentity, ...getMyCharacters()]

  onMount(() => {
    if (user.id) {
      if (data.unread?.gameChat) { delete data.unread.gameChat }
      if (showDiscussion && useIdentities) {
        $identityStore.activeChatIdentity = $identityStore.activeChatIdentity || identities[0].id
        identitySelect.value = $identityStore.activeChatIdentity
      }
    }
    if (showDiscussion) { loadPosts() }
    window.addEventListener('pagehide', saveUnsent)
  })

  async function loadPosts () {
    const { data: postData, count, error } = await supabase.from('posts_owner').select('id, owner, owner_name, owner_portrait, owner_type, created_at, content, moderated, thumbs, hearts, frowns, laughs, shocks', { count: 'exact' }).eq('thread', thread).order('created_at', { ascending: false }).range(page * limit, page * limit + limit - 1)
    if (error) { return handleError(error) }
    $posts = postData
    pages = Math.ceil(count / limit)
  }

  function getIdentity () {
    return identities.find((identity) => { return identity.id === $identityStore.activeChatIdentity })
  }

  async function submitPost () {
    if (saving || textareaValue === '') { return }
    saving = true
    const identity = useIdentities ? getIdentity() : userIdentity
    if (editing) {
      await sendPost('PATCH', { id: editing, thread, content: textareaValue, owner: identity.id, ownerType: identity.type })
    } else {
      await sendPost('POST', { thread, content: textareaValue, owner: identity.id, ownerType: identity.type })
    }
    textareaValue = ''
    await loadPosts()
    saving = false
    editing = false
  }

  async function deletePost (id) {
    if (!window.confirm('Opravdu smazat příspěvek?')) { return }
    const res = await fetch(`/api/post?id=${id}&thread=${data.openai_thread}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    showSuccess('Příspěvek smazán')
    await loadPosts()
  }

  async function moderatePost (id) {
    if (!window.confirm('Moderovat: Opravdu skrýt příspěvek všem? Tato akce je nevratná.')) { return }
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
    document.getElementsByClassName('headlines')[0].scrollIntoView({ behavior: 'smooth' })
    // saving is done in submitPost
  }

  async function triggerReply (postId, userName) {
    textareaRef.addReply(postId, userName)
  }

  async function saveUnsent () {
    if (textareaRef) { $discussionStore.unsent = await textareaRef.getContent() }
  }
</script>

<main>
  {#if showDiscussion}
    {#if user.id}
      {#if $platform === 'desktop'}
        <div class='headlines'>
          <h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
          {#if useIdentities}<h3 class='sender'>Identita</h3>{/if}
        </div>
        <div class='addPostWrapper'>
          <TextareaExpandable userId={user.id} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton disableEmpty />
          {#if useIdentities}
            <div class='senderWrapper'>
              <select size='4' bind:this={identitySelect} bind:value={$identityStore.activeChatIdentity}>
                {#each identities as identity}
                  <option value={identity.id} class={identity.type}>{identity.name}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>
      {:else}
        <h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
        <TextareaExpandable userId={user.id} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton disableEmpty />
        {#if useIdentities}
          <h3 class='sender'>Identita</h3>
          <select size='4' bind:this={identitySelect} bind:value={$identityStore.activeChatIdentity}>
            {#each identities as identity}
              <option value={identity.id}>{identity.name}</option>
            {/each}
          </select>
        {/if}
      {/if}
    {/if}

    {#key $posts}
      <Thread {posts} {user} {unread} id={thread} bind:page={page} {pages} allowReactions onPaging={loadPosts} canModerate={isOwner} myIdentities={identities} onReply={triggerReply} onModerate={moderatePost} onDelete={deletePost} onEdit={triggerEdit} iconSize={$platform === 'desktop' ? 70 : 40} />
    {/key}
  {:else}
    <p>Tato diskuze není veřejná.</p>
  {/if}
</main>

<style>
  .addPostWrapper {
    display: flex;
    width: 100%;
    gap: 20px;
  }
    select {
      background: none;
    }
    .senderWrapper select {
      width: 200px;
    }
  .headlines {
    display: flex;
  }
    .headlines .text {
      flex: 1;
    }
    .headlines .sender {
      width: 200px;
    }
  @media (max-width: 860px) {
    select {
      width: 100%;
    }
  }

</style>
