<script>
  import { onMount } from 'svelte'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { getSavedStore } from '@lib/stores'
  import { showSuccess, showError } from '@lib/toasts'
  import { supabase, handleError, sendPost } from '@lib/database-browser'
  import { clone, isFilledArray, addCharacterNameStyles } from '@lib/utils'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  let { user = {}, data = {}, canModerate = false, slug, contentSection, isPermitted = true, thread, unread = $bindable(0), useIdentities = false, mentionList = [] } = $props()

  const limit = unread > 50 ? Math.min(unread, 500) : 50
  const showDiscussion = data.open_discussion || isPermitted
  const discussionStore = getSavedStore(slug)
  const canChangeOrder = contentSection === 'games' || contentSection === 'boards'
  const isReportBoard = contentSection === 'boards' && data.id === 3
  const orderStore = canChangeOrder ? getSavedStore('discussion-order-' + thread, { ascending: false }) : null

  let posts = $state([])
  let textareaRef = $state()
  let textareaValue = $state($discussionStore.unsent || '') // load unsent post
  let identitySelect = $state()
  let saving = $state(false)
  let editing = $state(false)
  let page = $state(0)
  let pages = $state()
  let loading = $state(true)
  let threadUnread = $state(unread)
  let showImportantOnly = $state(false)
  const ascending = $derived($orderStore?.ascending === true)
  let pageUnread = $state(0)
  let loadRequest = 0

  function changeOrder (event) {
    $orderStore.ascending = event.currentTarget.value === 'asc'
    page = 0
    loadPosts()
  }

  function switchTab (important) {
    showImportantOnly = important
    page = 0
    loadPosts()
  }

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
    threadUnread = unread
    if (user.id) {
      if (data.unread?.gameChat) { data.unread.gameChat = 0 }
      if (showDiscussion && useIdentities) {
        $discussionStore.activeIdentity = $discussionStore.activeIdentity || identities[0].id
        identitySelect.value = $discussionStore.activeIdentity
      }
    } else { unread = 0 }
    if (showDiscussion) { loadPosts() }
    const posters = await loadAllPosters() || []
    // Game characters come from the current roster, never from historical posts.
    const combined = [...posters.filter(poster => !useIdentities || poster.type !== 'character'), ...mentionList]
    mentionList = Array.from(new Map(combined.map(poster => [`${poster.type}:${poster.id}`, poster])).values())
    if (isFilledArray(mentionList) && isFilledArray(data.characters)) {
      addCharacterNameStyles(data.characters)
    }
  })

  async function loadPosts (targetPage = page, showLatest = false) {
    const request = ++loadRequest
    const params = { _thread: thread, page: targetPage, _limit: limit, ascending }
    loading = true
    let query
    if (isReportBoard && !canModerate) {
      query = user.id
        ? await supabase.rpc('get_discussion_posts_special', { ...params, user_id: user.id })
        : { data: { count: 0, postdata: [] } }
    } else {
      query = await supabase.rpc('get_discussion_posts', { ...params, _important_only: showImportantOnly })
    }
    if (request !== loadRequest) { return }
    const { data: rpcData, error } = query
    if (error) {
      loading = false
      return handleError(error)
    }
    const { postdata, count } = rpcData
    pages = Math.ceil(count / limit)
    const lastPage = Math.max(0, pages - 1)
    const nextPage = showLatest ? lastPage : Math.min(targetPage, lastPage)
    if (nextPage !== targetPage) { return loadPosts(nextPage, showLatest) }

    page = targetPage
    posts = postdata || []
    const newerPosts = params.ascending ? count - targetPage * limit - posts.length : targetPage * limit
    pageUnread = Math.min(posts.length, Math.max(0, threadUnread - newerPosts))
    loading = false
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
    if (saving || textareaValue === '') { return false }
    saving = true
    const identity = useIdentities ? getIdentity() : userIdentity
    if (!identity) {
      saving = false
      return showError('Chybí identita pro příspěvek')
    }
    let audience = null
    let response
    if (isReportBoard) {
      const repliedIds = [...textareaValue.matchAll(/data-user="([^"]+)"/g)].map(match => match[1])
      if (repliedIds.length) { audience = repliedIds }
    }
    if (editing) {
      response = await sendPost('PATCH', { id: editing, thread, content: textareaValue, owner: identity.id, ownerType: identity.type, audience })
    } else {
      response = await sendPost('POST', { thread, content: textareaValue, owner: identity.id, ownerType: identity.type, audience, postType: contentSection === 'games' ? 'game' : 'other' })
    }
    if (!response.error) {
      const showLatest = ascending && !editing && !showImportantOnly
      if (!ascending) { page = 0 }
      textareaRef.clearContent()
      $discussionStore.unsent = ''
      await loadPosts(showLatest ? Math.max(0, (pages || 1) - 1) : page, showLatest)
      editing = false
      saving = false
      return true
    }
    saving = false
    return false
  }

  async function deletePost (post) {
    if (window.confirm('Opravdu smazat příspěvek?')) {
      const res = await fetch(`/api/post?id=${post.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
      showSuccess('Příspěvek smazán')
      await loadPosts()
    }
  }

  async function moderatePost (id) {
    if (window.confirm('Moderovat: Opravdu skrýt příspěvek všem? Tato akce je nevratná.')) {
      const res = await fetch('/api/post', { method: 'PATCH', body: JSON.stringify({ id, moderate: true }), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
      showSuccess('Příspěvek skryt všem')
      await loadPosts()
      return true
    }
  }

  async function triggerEdit (post) {
    editing = post.id
    textareaValue = post.content
    textareaRef.triggerEdit(post.id, post.content)
    $discussionStore.activeIdentity = post.owner
    const headlineEl = document.getElementsByClassName('headlines')[0]
    if (headlineEl) { headlineEl.scrollIntoView({ behavior: 'smooth' }) }
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
                {#each identities as identity (identity.id)}
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
            {#each identities as identity (identity.id)}
              <option value={identity.id}>{identity.name}</option>
            {/each}
          </select>
        {/if}
      {/if}
    {/if}

    <div class='tabs secondary importance'>
      <button onclick={() => { switchTab(false) }} class:active={!showImportantOnly}>Vše</button>
      <button onclick={() => { switchTab(true) }} class:active={showImportantOnly}>Důležité</button>
    </div>

    <Thread type='discussion' {loading} {posts} {user} {ascending} unread={showImportantOnly ? 0 : canChangeOrder ? pageUnread : threadUnread} id={thread} bind:page={page} {pages} allowReactions onPaging={loadPosts} {canModerate} myIdentities={identities} onReply={triggerReply} onModerate={moderatePost} onDelete={deletePost} onEdit={triggerEdit} iconSize={$platform === 'desktop' ? 70 : 40} {contentSection} contentId={data.id} />
    {#if canChangeOrder}
      <select class='discussion-order' aria-label='Pořadí příspěvků' value={ascending ? 'asc' : 'desc'} onchange={changeOrder}>
        <option value='desc'>Od konce</option>
        <option value='asc'>Od začátku</option>
      </select>
    {/if}
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
      height: 100%;
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
  .importance {
    margin-top: 20px;
  }
  .discussion-order {
    margin: 10px 0 0 5px;
    width: auto;
  }

  @media (max-width: 860px) {
    select {
      width: 100%;
    }
  }

</style>
