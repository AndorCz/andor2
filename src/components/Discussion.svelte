<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { getSavedStore } from '@lib/stores'
  import { showSuccess, showError } from '@lib/toasts'
  import { supabase, handleError, sendPost } from '@lib/database-browser'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { clone, isFilledArray, addCharacterNameStyles } from '@lib/utils'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  export let user = {}
  export let data = {}
  export let canModerate = false
  export let slug
  export let contentSection
  export let isPermitted = true
  export let thread
  export let unread = 0
  export let useIdentities = false

  const posts = writable([])
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
  let mentionList = []

  // set identities for discussion
  const getMyCharacters = () => {
    if (!useIdentities || !showDiscussion) { return [] }
    let myCharacters = data.characters.filter((char) => { return char.player?.id === user.id && char.state === 'alive' && char.accepted === true })
    myCharacters = clone(myCharacters)
    myCharacters.forEach((char) => { char.type = 'character' })
    return myCharacters
  }
  const userIdentity = { name: user.name, id: user.id, type: 'user' }
  const identities = getMyCharacters()
  identities.push(userIdentity)

  onMount(async () => {
    if (user.id) {
      if (data.unread?.gameChat) { delete data.unread.gameChat }
      if (showDiscussion && useIdentities) {
        $discussionStore.activeIdentity = $discussionStore.activeIdentity || identities[0].id
        identitySelect.value = $discussionStore.activeIdentity
      }
    } else { unread = 0 }
    if (showDiscussion) { loadPosts() }
    mentionList = await loadAllPosters()
    if (isFilledArray(mentionList) && isFilledArray(data.characters)) {
      addCharacterNameStyles(data.characters)
    }
  })

  async function loadPosts () {
    let query
    if (data.id === 3 && !canModerate) { // Special board "Nahlášení obsahu" (see only your posts and responses from mods)
      if (!user.id) { return }
      query = await supabase.rpc('get_discussion_posts_special', { user_id: user.id, _thread: thread, page, _limit: limit })
    } else {
      query = await supabase.rpc('get_discussion_posts', { _thread: thread, page, _limit: limit, ascending: false })
    }
    const { data: rpcData, error } = await query
    if (error) { return handleError(error) }
    const { postdata, count } = rpcData
    if (postdata) {
      $posts = postdata
    }
    pages = Math.ceil(count / limit)
  }

  function getIdentity () {
    return identities.find((identity) => { return identity.id === $discussionStore.activeIdentity })
  }

  async function loadAllPosters () {
    const { data: posters, error } = await supabase.from('discussion_posts_owner').select('owner, owner_name, owner_type').eq('thread', thread)
    if (error) { return handleError(error) }
    // return unique posters
    return posters.reduce((acc, poster) => {
      if (!acc.some((p) => p.id === poster.owner)) {
        acc.push({ name: poster.owner_name, id: poster.owner, type: poster.owner_type })
      }
      return acc
    }, [])
  }

  async function submitPost () {
    if (saving || textareaValue === '') { return }
    saving = true
    const identity = useIdentities ? getIdentity() : userIdentity
    let audience = null
    let response
    if (data.id === 3) { // Special board "Nahlášení obsahu"
      const repliedIds = [...textareaValue.matchAll(/data-user="([^"]+)"/g)].map(match => match[1])
      if (repliedIds.length) { audience = repliedIds }
    }
    if (editing) {
      response = await sendPost('PATCH', { id: editing, thread, content: textareaValue, owner: identity.id, ownerType: identity.type, audience })
    } else {
      response = await sendPost('POST', { thread, content: textareaValue, owner: identity.id, ownerType: identity.type, audience })
    }
    if (!response.error) {
      textareaValue = ''
      $discussionStore.unsent = ''
      await loadPosts()
      saving = false
      editing = false
    }
  }

  async function deletePost (post) {
    if (!window.confirm('Opravdu smazat příspěvek?')) { return }
    const res = await fetch(`/api/post?id=${post.id}&thread=${data.openai_thread}`, { method: 'DELETE' })
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

  async function triggerEdit (post) {
    editing = post.id
    textareaValue = post.content
    textareaRef.triggerEdit(post.id, post.content)
    document.getElementsByClassName('headlines')[0].scrollIntoView({ behavior: 'smooth' })
    $discussionStore.activeIdentity = post.owner
    // saving is done in submitPost
  }

  async function triggerReply (postId, userName, userId) {
    textareaRef.addReply(postId, userName, userId)
  }

  let timeout
  async function saveUnsent () { // debounced
    if (textareaRef) {
      clearTimeout(timeout)
      timeout = setTimeout(async () => {
        $discussionStore.unsent = await textareaRef.getContent()
      }, 500) // Delay in ms, adjust as needed
    }
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
          <TextareaExpandable {user} {mentionList} onTyping={saveUnsent} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton disableEmpty />
          {#if useIdentities}
            <div class='senderWrapper'>
              <select size='4' bind:this={identitySelect} bind:value={$discussionStore.activeIdentity}>
                {#each identities as identity}
                  <option value={identity.id} class={identity.type}>{identity.name}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>
      {:else}
        <h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
        <TextareaExpandable {user} {mentionList} onTyping={saveUnsent} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton disableEmpty />
        {#if useIdentities}
          <h3 class='sender'>Identita</h3>
          <select size='4' bind:this={identitySelect} bind:value={$discussionStore.activeIdentity}>
            {#each identities as identity}
              <option value={identity.id}>{identity.name}</option>
            {/each}
          </select>
        {/if}
      {/if}
    {/if}

    <Thread {posts} {user} {unread} id={thread} bind:page={page} {pages} allowReactions onPaging={loadPosts} {canModerate} myIdentities={identities} onReply={triggerReply} onModerate={moderatePost} onDelete={deletePost} onEdit={triggerEdit} iconSize={$platform === 'desktop' ? 70 : 40} {contentSection} contentId={data.id} />
  {:else}
    <div class='info'><span class='material'>info</span>Tato diskuze není veřejná</div>
  {/if}
</main>

<style>
  main {
    padding-top: 10px;
  }
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
  .info {
    margin: 60px 0px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  @media (max-width: 860px) {
    select {
      width: 100%;
    }
  }

</style>
