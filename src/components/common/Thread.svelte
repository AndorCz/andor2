<script>
  import { onMount, onDestroy, afterUpdate } from 'svelte'
  import { setRead, getReply } from '@lib/database-browser'
  import { bookmarks } from '@lib/stores'
  import { isFilledArray } from '@lib/utils'
  import { tooltipContent } from '@lib/tooltip'
  import Post from '@components/common/Post.svelte'

  export let id
  export let user
  export let posts
  export let loading
  export let contentId
  export let contentSection
  export let unread = 0
  export let canDeleteAll = false
  export let canModerate = false
  export let myIdentities = []
  export let allowReactions = false
  export let onDelete = null
  export let onEdit = null
  export let onModerate = null
  export let onReply = null
  export let onPaging = null
  export let page = 0
  export let pages = null
  export let iconSize = 70
  export let diceMode = 'none' // 'post', 'icon', 'none'

  let lastPostId
  let threadEl
  let replyPostEl
  let replyPostData
  let lastRefresh = Date.now()
  let autorefreshRunning = false
  let frameId

  const replies = {}

  onMount(async () => {
    if (isFilledArray($posts)) { lastPostId = $posts[0].id }
    if (user.autorefresh) { refresh() }
  })

  onDestroy(() => {
    if (frameId) { cancelAnimationFrame(frameId) }
  })

  afterUpdate(() => {
    if (isFilledArray($posts)) {
      removeListeners()
      setupReplyListeners()
    }
  })

  function removeListeners () {
    const cites = document.querySelectorAll('cite[data-id]')
    for (const citeEl of cites) {
      citeEl.removeEventListener('pointerdown', addReply)
      citeEl.removeEventListener('mouseenter', showReply)
      citeEl.removeEventListener('mouseleave', hideReply)
    }
  }

  async function setupReplyListeners () { // pre-requisite for replies
    // look through <cite> tags with data-id attributes and load posts from subapase with that post id. Register the post as a tippy tooltip when hovered over the quote.
    const cites = document.querySelectorAll('cite[data-id]')
    for (const citeEl of cites) {
      const id = parseInt(citeEl.getAttribute('data-id'))
      // for each cite, load the post from supabase and save it's data
      replies[id] = await getReply($posts, id)
      citeEl.addEventListener('pointerdown', addReply)
      citeEl.addEventListener('mouseenter', showReply)
      citeEl.addEventListener('mouseleave', hideReply)
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
    } else { // create a new container for the reply
      const container = document.createElement('div')
      container.classList.add('nestedReply')
      event.target.parentNode.insertBefore(container, event.target.nextSibling)
      new Post({ target: container, props: { post: replyData, user, iconSize: 0 } })
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

  function isMyPost (id) {
    return myIdentities.find((identity) => { return identity.id === id })
  }

  function triggerPaging (newPage) {
    page = newPage
    onPaging(page)
    threadEl.scrollIntoView({ behavior: 'smooth' })
  }

  function seen () {
    setRead(user.id, 'thread-' + id)
    if (isFilledArray($posts)) { lastPostId = $posts[0].id }
    if (contentId && contentSection && isFilledArray($bookmarks[contentSection])) {
      const bookmark = $bookmarks[contentSection].find((page) => { return page.id === contentId })
      if (bookmark) { bookmark.unread = 0 }
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

  $: if (isFilledArray($posts) && $posts[0].id !== lastPostId) { seen() } // set read for new posts, even for autorefresh
  $: if (contentSection === 'boards' && contentId === 3) { seen() } // custom version for 'nahlášení obsahu'
</script>

<main bind:this={threadEl}>
  {#if loading}
    <p class='info'>Načítám příspěvky...</p>
  {:else if isFilledArray($posts)}
    {#each $posts as post, index (`${post.id}-${post.updated_at}`)}
      {#if post.dice}
        {#if diceMode === 'post'}
          <Post {post} {user} {allowReactions} {canDeleteAll} {iconSize} {onDelete} isMyPost={isMyPost(post.owner)} />
        {:else if diceMode === 'icon'}
          <span class='dicePost' use:tooltipContent={{ maxWidth: 'none' }}>
            <Post {post} {user} {allowReactions} {canDeleteAll} {iconSize} {onDelete} isMyPost={isMyPost(post.owner)} />
          </span>
        {/if}
      {:else if diceMode !== 'post'}<!-- don't show regular posts in this mode -->
        <Post {post} unread={index < unread} {user} {allowReactions} {canDeleteAll} {iconSize} {onReply} {onDelete} {onEdit} {onModerate} isMyPost={isMyPost(post.owner)} {canModerate} />
      {/if}
    {/each}
    {#if pages}
      <div class='pagination'>
        {#each { length: pages } as _, i}
          <button on:click={() => { triggerPaging(i) } } disabled={i === page}>{i + 1}</button>
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
  main, center {
    margin-top: 30px;
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
  }
  @media (max-width: 860px) {
    #replyPreview {
      width: 150%;
    }
  }
</style>
