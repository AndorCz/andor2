<script>
  import ChatPost from '@components/chat/ChatPost.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import { mount } from 'svelte'
  import { onMount, onDestroy } from 'svelte'
  import { showSuccess, showError } from '@lib/toasts'
  import { throttle, isFilledArray } from '@lib/utils'
  import { supabase, handleError, sendPost, setRead, getReply } from '@lib/database-browser'

  const { user = {}, unread = 0 } = $props()

  let channel
  let posts = $state([])
  let saving = $state(false)
  let people = $state({})
  let postsEl = $state()
  let editing = $state(false)
  let textareaEl = $state()
  let mentionList = $state([])
  let replyPostEl = $state()
  let replyPostData = $state()
  let textareaValue = $state('')
  let shouldAutoScroll = $state(true)
  let previousPostsLength = $state(0)
  const typing = $state({})
  const replies = {}

  onMount(async () => {
    channel = supabase.channel('chat', { config: { presence: { key: user.id } } })
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: 'thread=eq.1' }, (payload) => {
        loadPosts()
      })
      .on('presence', { event: 'sync' }, () => { // sync is called on every presence change
        const newState = channel.presenceState()
        Object.keys(newState).forEach((key) => {
          addPoster({ id: key, name: newState[key][0].user, type: 'user' })
        })
        people = newState
      })
      .on('broadcast', { event: 'typing' }, (data) => { // triggered when someone is typing
        typing[data.payload.user] = true
        removeTyping(data.payload.user)
      })
      // .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      //   // console.log('somebody joined', key, newPresences)
      // })
      // .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      //   // console.log('somebody left', key, leftPresences)
      // })

    mentionList = await loadAllPosters()
    const userStatus = { user: user.name, online_at: new Date().toISOString() }

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') { return }
      await channel.track(userStatus)
    })
  })

  $effect(() => {
    if (isFilledArray(posts)) {
      removeListeners()
      setupReplyListeners()
    }
  })

  onDestroy(() => {
    if (channel) { supabase.removeChannel(channel) }
  })

  function removeListeners () {
    const cites = document.querySelectorAll('cite[data-id]')
    for (const citeEl of cites) {
      citeEl.removeEventListener('pointerdown', addReply)
      citeEl.removeEventListener('mouseenter', showReply)
      citeEl.removeEventListener('mouseleave', hideReply)
      postsEl.removeEventListener('scroll', hideReply)
    }
  }

  async function setupReplyListeners () { // pre-requisite for replies
    // look through <cite> tags with data-id attributes and load posts from subapase with that post id. Register the post as a tippy tooltip when hovered over the quote.
    const cites = document.querySelectorAll('cite[data-id]')
    for (const citeEl of cites) {
      const id = parseInt(citeEl.getAttribute('data-id'))
      // for each cite, load the post from supabase and save it's data
      replies[id] = await getReply(posts, id)
      citeEl.addEventListener('pointerdown', addReply)
      citeEl.addEventListener('mouseenter', showReply)
      citeEl.addEventListener('mouseleave', hideReply)
      postsEl.addEventListener('scroll', hideReply)
    }
  }

  function addReply (event) {
    const postId = parseInt(event.target.getAttribute('data-id'))
    const replyData = replies[postId]
    if (!replyData) return

    // check if the container already exists
    const existingContainer = event.target.nextElementSibling
    const isReplyContainer = existingContainer && existingContainer.classList.contains('nestedReply')

    if (isReplyContainer) { // if the container exists, remove it (toggle reply visibility)
      event.target.parentNode.removeChild(existingContainer)
      const container = document.createElement('div')
      container.classList.add('nestedReply')
      event.target.parentNode.insertBefore(container, event.target.nextSibling)
      mount(ChatPost, { target: container, props: { post: replyData, user, iconSize: 0 } })
      setupReplyListeners()
      setupReplyListeners()
    }
  }

  function showReply (event) {
    const id = parseInt(event.target.getAttribute('data-id'))
    replyPostData = replies[id]
    if (replyPostData) {
      replyPostEl.style.display = 'block'
      // get number of pixels the content is scrolled from the top
      const scrollTop = window.scrollY
      const offsetTop = event.target.getBoundingClientRect().top
      const headerSize = 150
      replyPostEl.style.top = scrollTop - headerSize + offsetTop - 20 + 'px'
    }
  }

  function hideReply () {
    replyPostEl.style.display = 'none'
  }

  function addPoster (poster) {
    if (!mentionList.some((p) => p.id === poster.id)) {
      mentionList.push(poster)
    }
  }

  async function loadAllPosters () {
    const { data: posters, error } = await supabase.from('discussion_posts_owner').select('owner, owner_name, owner_type').eq('thread', 1)
    if (error) { return handleError(error) }
    // return unique posters
    return posters.reduce((acc, poster) => {
      if (!acc.some((p) => p.id === poster.owner)) {
        acc.push({ name: poster.owner_name, id: poster.owner, type: poster.owner_type })
      }
      return acc
    }, [])
  }

  function handlePostsScroll (node) {
    function onScroll () {
      const { scrollTop, scrollHeight, clientHeight } = postsEl
      const scrollBottom = scrollHeight - scrollTop - clientHeight
      shouldAutoScroll = scrollBottom < 50 // consider "near bottom" if within 50px of the bottom
    }
    node.addEventListener('scroll', onScroll)
    return {
      destroy () { node.removeEventListener('scroll', onScroll) }
    }
  }

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  async function seen () {
    await setRead(user.id, 1)
  }

  function onEdit (id, content) {
    editing = id
    textareaValue = content
    textareaEl.triggerEdit(id, content)
    document.getElementById('textareaWrapper').scrollIntoView({ behavior: 'smooth' })
    // saving is done in submitPost
  }

  async function onDelete (id) {
    const res = await fetch(`/api/post?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    showSuccess('Příspěvek smazán')
    await loadPosts()
  }

  async function triggerReply (postId, userName, userId) {
    textareaEl.addReply(postId, userName, userId)
  }

  async function loadPosts () {
    const query = await supabase.rpc('get_discussion_posts', { _thread: 1, page: 0, _limit: 2000, ascending: true })
    const { data: rpcData, error } = await query
    if (error) { handleError(error) } else {
      posts = rpcData.postdata
    }
    await seen()
  }

  async function submitPost () {
    if (saving || textareaValue === '') { return }
    saving = true
    let response
    if (editing) {
      response = await sendPost('PATCH', { id: editing, thread: 1, content: textareaValue, owner: user.id, ownerType: 'user' })
    } else {
      response = await sendPost('POST', { thread: 1, content: textareaValue, owner: user.id, ownerType: 'user', postType: 'other' })
    }
    if (!response.error) {
      textareaValue = ''
      await loadPosts()
      saving = false
      editing = false
    }
  }

  function removeTyping (name) {
    setTimeout(() => {
      delete typing[name]
    }, 3000)
  }

  const handleTyping = throttle(() => {
    channel.send({ type: 'broadcast', event: 'typing', payload: { user: user.name } })
  }, 3000)

  // Reactive statement for scrolling
  $effect(() => {
    if (postsEl && posts?.length) {
      if (previousPostsLength === 0 && posts.length > 0) {
        // Instant scroll for the initial load
        setTimeout(() => { postsEl.scrollTop = postsEl.scrollHeight }, 10)
      } else if (previousPostsLength < posts.length) {
        // Smooth scroll for subsequent updates (new messages)
        if (shouldAutoScroll) {
          // Smooth scroll to the bottom
          setTimeout(() => { postsEl.scrollTo({ top: postsEl.scrollHeight, behavior: 'smooth' }) }, 10)
        }
      }
      previousPostsLength = posts.length // Update the length after scrolling
    }
  })
</script>

{#await waitForAnimation() then}
  <div id='chat'>
    {#await loadPosts()}
      <span class='loading'>Načítám...</span>
    {:then}
      <div class='posts' bind:this={postsEl} use:handlePostsScroll>
        {#if posts.length > 0}
          {#each posts as post, index (`${post.id}-${post.updated_at}`)}
            <ChatPost unread={index >= posts.length - unread} {user} {post} {onEdit} {onDelete} onReply={triggerReply} />
          {/each}
        {:else}
          <center>Žádné příspěvky</center>
        {/if}
      </div>
      <div id='textareaWrapper'>
        <!-- names of present people -->
        {#if Object.keys(typing).length > 0}
          <div class='typing'>
            {Object.keys(typing).join(' píše, ')} píše
          </div>
        {/if}
        <TextareaExpandable forceBubble allowHtml {mentionList} autoFocus {user} bind:this={textareaEl} bind:value={textareaValue} bind:editing={editing} disabled={saving} onSave={submitPost} onTyping={handleTyping} showButton={true} minHeight={30} enterSend singleLine disableEmpty />
      </div>
    {:catch error}
      <span class='error'>Konverzaci se nepodařilo načíst</span>
    {/await}
    <!-- names of present people -->
    <div class='people'>
      {#if Object.keys(people).length > 0}
        Právě přítomní:
        {#each Object.values(people) as person (person[0].user)}
          <span class='person user'>{person[0].user}</span>
        {/each}
      {/if}
    </div>
  </div>
  <div id='replyPreview' bind:this={replyPostEl}>
    {#if replyPostData}
      {#key replyPostData}
        <ChatPost {user} post={replyPostData} {onEdit} {onDelete} onReply={triggerReply} />
      {/key}
    {/if}
  </div>
{/await}

<style>
  #chat {
    height: calc(100svh);
    display: flex;
    flex-direction: column;
  }
    .loading, .error {
      text-align: center;
    }
    .loading {
      font-style: italic;
    }
    .error {
      color: var(--error);
    }

    .posts {
      flex: 1;
      overflow-y: scroll;
      padding: 5px;
      margin-bottom: 20px;
    }

    #textareaWrapper {
      position: relative;
    }
      .typing {
        position: absolute;
        top: -35px;
        left: 5px;
        background-color: var(--panel);
        border-radius: 10px;
        padding: 5px;
      }
    .people {
      overflow: auto;
      padding-top: 20px;
      min-height: 80px;
    }
      .person {
        display: inline-block;
        padding: 10px;
        margin-left: 5px;
        margin-bottom: 5px;
        border-radius: 10px;
        background-color: var(--block);
      }

  #replyPreview {
    position: absolute;
    left: 20px;
    min-width: 50vw;
    display: none;
    transform: scale(0.75);
    transform-origin: top left;
    padding: 20px;
    background-color: var(--panel);
    box-shadow: 0px 0px 10px var(--background);
  }
  @media (max-width: 860px) {
    #replyPreview {
      width: 150%;
    }
  }
  @media (max-width: 500px) {
    .people {
      margin-top: 5px;
      padding-top: 10px;
      height: 60px;
    }
  }
</style>
