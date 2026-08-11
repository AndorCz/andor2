<script>
  import { bookmarks } from '@lib/stores'
  import { isFilledArray } from '@lib/utils'
  import { tooltipContent } from '@lib/tooltip'
  import { setRead, getReply } from '@lib/database-browser'
  import { onMount, onDestroy, mount, tick } from 'svelte'
  import Post from '@components/common/Post.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  let { id, type, user, posts, loading, contentId, contentSection, unread = 0, canDeleteAll = false, canModerate = false, myIdentities = [], allowReactions = false, enableAutorefresh = true, onDelete = null, onEdit = null, onModerate = null, onReply = null, onCreateReply = null, onPaging = null, page = $bindable(0), pages = null, iconSize = 70, diceMode = 'none' } = $props()

  let postCount = $state(0)
  let lastPostId = $state()
  let threadEl = $state()
  let replyPostEl = $state()
  let replyPostData = $state()
  let replyEditor = $state()
  let replyTarget = $state()
  let replyValue = $state('')
  let replySaving = $state(false)
  let wallRepliesExpanded = $state(false)
  let lastRefresh = Date.now()
  let autorefreshRunning = false
  let frameId

  const replies = {}

  onMount(async () => {
    if (user.autorefresh && enableAutorefresh) { refresh() }
    setRead(user.id, id)
    if (isFilledArray(posts)) { postCount = posts.length }
  })

  onDestroy(() => {
    if (frameId) { cancelAnimationFrame(frameId) }
  })

  // update listeners for replies, even for new posts
  function postsUpdate () {
    if (posts.length !== 0) {
      removeListeners()
      setupReplyListeners()
    }
  }

  function removeListeners () {
    const cites = threadEl?.querySelectorAll('cite[data-id]') || []
    for (const citeEl of cites) {
      citeEl.removeEventListener('pointerdown', addReply)
      citeEl.removeEventListener('mouseenter', showReply)
      citeEl.removeEventListener('mouseleave', hideReply)
      window.removeEventListener('scroll', hideReply)
    }
  }

  function setupReplyListeners () { // pre-requisite for replies
    setTimeout(async () => { // wait for DOM to update
      // look through <cite> tags with data-id attributes and load posts from subapase with that post id. Register the post as a tippy tooltip when hovered over the quote.
      const cites = threadEl?.querySelectorAll('cite[data-id]') || []
      for (const citeEl of cites) {
        const id = parseInt(citeEl.getAttribute('data-id'))
        // for each cite, load the post from supabase and save it's data
        replies[id] = await getReply(posts, id)
        citeEl.addEventListener('pointerdown', addReply)
        citeEl.addEventListener('mouseenter', showReply)
        citeEl.addEventListener('mouseleave', hideReply)
        window.addEventListener('scroll', hideReply)
      }
    }, 0)
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
    } else { // create a new container for the reply
      const container = document.createElement('div')
      container.classList.add('nestedReply')
      event.target.parentNode.insertBefore(container, event.target.nextSibling)
      mount(Post, { target: container, props: { post: replyData, user, iconSize: 0 } })
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
    if (replyPostEl) {
      replyPostEl.style.display = 'none'
    }
  }

  function isMyPost (id) {
    return myIdentities.find((identity) => { return identity.id === id })
  }

  async function openReplyEditor (post) {
    if (replyTarget?.id === post.id) {
      replyTarget = null
      replyValue = ''
      return
    }
    replyTarget = post
    replyValue = ''
    await tick()
    replyEditor?.focus()
  }

  async function submitReply () {
    if (replySaving || !replyValue.trim() || !replyTarget) { return false }
    replySaving = true
    const saved = await onCreateReply(replyTarget, replyValue)
    replySaving = false
    if (saved === false) { return false }
    replyEditor.clearContent()
    replyTarget = null
    return true
  }

  function triggerPaging (newPage) {
    page = newPage
    onPaging(page)
    threadEl.scrollIntoView({ behavior: 'smooth' })
  }

  function seen () {
    setRead(user.id, id)
    if (isFilledArray(posts)) { lastPostId = posts[0].id }
    if (contentId && contentSection && isFilledArray($bookmarks[contentSection])) {
      const bookmark = $bookmarks[contentSection].find((page) => { return page.id === contentId })
      if (bookmark) {
        if (bookmark.unread_discussion && type === 'discussion') { bookmark.unread_discussion = 0 }
        if (bookmark.unread_game && type === 'game') { bookmark.unread_game = 0 }
        if (bookmark.unread) { bookmark.unread = 0 }
      }
      $bookmarks = $bookmarks
    }
  }

  // autorefresh every 10 seconds, if enabled in user settings
  async function refresh () {
    if (Date.now() - lastRefresh > 10000) {
      if (autorefreshRunning) return
      autorefreshRunning = true
      lastRefresh = Date.now()
      await onPaging(page)
      autorefreshRunning = false
    }
    frameId = requestAnimationFrame(refresh)
  }

  $effect(() => {
    if (isFilledArray(posts)) {
      if (loading === false && postCount !== posts.length) {
        postsUpdate()
        if (posts[0].id !== lastPostId) {
          // If this is autorefresh and we have new posts, increment unread
          if (user.autorefresh && postCount > 0 && posts.length > postCount) {
            const newPostsCount = posts.length - postCount
            unread += newPostsCount
          }
          seen() // set read for new posts, even for autorefresh
        } else if (contentSection === 'boards' && contentId === 3) {
          seen() // custom version for 'nahlášení obsahu'
        }
      }
      postCount = posts.length
    }
  })
</script>

<main bind:this={threadEl}>
  {#if loading && !user.autorefresh}
    <p class='info'>Načítám příspěvky...</p>
  {:else if isFilledArray(posts)}
    {@const collapseWallReplies = type === 'wall' && posts.length - 1 > 3 && !wallRepliesExpanded}
    {#each posts as post, index (`${post.id}-${post.updated_at}`)}
      {@const isLastWallPost = type === 'wall' && posts[index + 1]?.wall_id !== post.wall_id}
      {@const hideWallReply = collapseWallReplies && index > 0 && index < posts.length - 1}
      {#if collapseWallReplies && index === 1}
        <div class='wall-more' style='--fullIconSize: {iconSize}px'>
          <button onclick={() => { wallRepliesExpanded = true }}>zobrazit více</button>
        </div>
      {/if}
      {#if !hideWallReply}
        {#if index === unread && unread > 0}
          <hr class='unreadLine' />
        {/if}
        {#if post.dice}
          {#if diceMode === 'post'}
            <Post {post} {user} {allowReactions} {canDeleteAll} {iconSize} {onDelete} isMyPost={isMyPost(post.owner)} />
          {:else if diceMode === 'icon'}
            <span class='dicePost' use:tooltipContent={{ maxWidth: 'none' }}>
              <Post {post} {user} {allowReactions} {canDeleteAll} {iconSize} {onDelete} isMyPost={isMyPost(post.owner)} />
            </span>
          {/if}
        {:else if diceMode !== 'post'}<!-- don't show regular posts in this mode -->
          <Post {post} unread={index < unread} {user} {allowReactions} {canDeleteAll} {iconSize} compact={type === 'wall' && post.position > 1} {onReply} {onDelete} {onEdit} {onModerate} isMyPost={isMyPost(post.owner)} {canModerate} />
          {#if isLastWallPost && onCreateReply && user.id}
            <div class='thread-reply-action' style='--fullIconSize: {iconSize}px'>
              <button class:active={replyTarget?.id === post.id} aria-expanded={replyTarget?.id === post.id} onclick={() => openReplyEditor(post)}>reagovat</button>
            </div>
          {/if}
          {#if replyTarget?.id === post.id}
            <div class='thread-reply-editor' style='--fullIconSize: {iconSize}px'>
              <TextareaExpandable {user} allowHtml forceBubble autoFocus minHeight={50} placeholder='Napiš reakci…' bind:this={replyEditor} bind:value={replyValue} disabled={replySaving} onSave={submitReply} showButton disableEmpty />
            </div>
          {/if}
        {/if}
      {/if}
    {/each}
    {#if pages}
      <div class='pagination'>
        {#each { length: pages } as _, i (i)}
          <button onclick={() => { triggerPaging(i) }} disabled={i === page}>{i + 1}</button>
        {/each}
      </div>
    {/if}
  {:else}
    <center>Žádné příspěvky</center>
  {/if}

  <div id='replyPreview' bind:this={replyPostEl}>
    {#if replyPostData}
      {#key replyPostData}
        <Post post={replyPostData} {user} {iconSize} />
      {/key}
    {/if}
  </div>
</main>

<style>
  main {
    padding-top: 10px;
  }

  center {
    margin-top: 30px;
  }

  hr.unreadLine {
    border: none;
    border-top: 2px solid var(--new);
    margin-top: 0px;
    margin-bottom: 5px;
    opacity: 0.5;
  }

  .dicePost {
    display: inline-block;
    width: 40px;
    height: 40px;
    margin-left: 0px;
    background-image: url('/dice/k10.png');
    background-size: 75% 75%;
    background-repeat: no-repeat;
    background-position: center;
    cursor: pointer;
    opacity: 0.7;
  }
    .dicePost:hover {
      opacity: 1;
    }

  .info {
    margin: 60px 0px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .thread-reply-editor {
    width: calc(100% - var(--fullIconSize) - 10px);
    margin: 5px 0px 10px calc(var(--fullIconSize) + 10px);
  }

  .thread-reply-action {
    width: calc(100% - var(--fullIconSize) - 10px);
    margin: 0px 0px 10px calc(var(--fullIconSize) + 10px);
    text-align: center;
  }
    .thread-reply-action button {
      padding: 5px 8px;
      color: var(--dim);
      opacity: 0.7;
      background: none;
      border: none;
      box-shadow: none;
      white-space: nowrap;
    }
      .thread-reply-action button:hover {
        color: var(--dim);
        opacity: 1;
      }

  .wall-more {
    width: calc(100% - var(--fullIconSize) - 10px);
    margin: 0px 0px 5px calc(var(--fullIconSize) + 10px);
    text-align: center;
  }
    .wall-more button {
      padding: 5px 8px;
      color: var(--dim);
      opacity: 0.7;
      background: none;
      border: none;
      box-shadow: none;
      white-space: nowrap;
    }
      .wall-more button:hover {
        color: var(--dim);
        opacity: 1;
      }

  .pagination {
    text-align: left;
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 22px;
      padding: 0px;
      width: 40px;
      height: 40px;
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
    z-index: 110;
  }
  @media (max-width: 860px) {
    .thread-reply-editor, .thread-reply-action {
      width: 100%;
      margin-left: 0px;
    }
    .wall-more {
      width: calc(100% - 30px);
      margin-left: 30px;
    }
    #replyPreview {
      width: 150%;
    }
  }
</style>
