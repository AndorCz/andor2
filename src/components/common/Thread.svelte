<script>
  import { onMount } from 'svelte'
  import { setRead, getReply } from '@lib/database'
  import { bookmarks } from '@lib/stores'
  import { isFilledArray } from '@lib/utils'
  import { tooltipContent } from '@lib/tooltip'
  import Post from '@components/common/Post.svelte'

  export let id
  export let user
  export let posts
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
  export let iconSize = 140
  export let diceMode = 'none' // 'post', 'icon', 'none'

  let threadEl
  let replyPostEl
  let replyPostData
  let lastRefresh = Date.now()
  let autorefreshRunning

  const replies = {}

  if (user.autorefresh && !autorefreshRunning) { refresh() }

  onMount(async () => {
    // handle replies
    if (posts) { // pre-requisite for replies
      // look through <cite> tags with data-id attributes and load posts from subapase with that post id. Register the post as a tippy tooltip when hovered over the quote.
      const cites = document.querySelectorAll('cite[data-id]')
      for (const citeEl of cites) {
        const id = parseInt(citeEl.getAttribute('data-id'))
        // for each cite, load the post from supabase and save it's data
        replies[id] = await getReply($posts, id)
        citeEl.addEventListener('mouseenter', showReply)
        citeEl.addEventListener('mouseleave', hideReply)
      }
    }
  })

  // autorefresh every 10 seconds, if enabled in user settings
  function refresh () {
    autorefreshRunning = true
    if (Date.now() - lastRefresh > 10000) {
      lastRefresh = Date.now()
      onPaging(page)
    }
    requestAnimationFrame(refresh)
  }

  function showReply (event) {
    const id = parseInt(event.target.getAttribute('data-id'))
    replyPostData = replies[id]
    if (replyPostData) {
      replyPostEl.style.display = 'block'
      replyPostEl.style.top = event.target.getBoundingClientRect().top + window.pageYOffset + 30 + 'px'
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
    if (contentSection && contentId) {
      const game = $bookmarks.games?.find((game) => { return game.id === contentId })
      if (game) { game.unread = 0 }
      $bookmarks = $bookmarks
    }
  }

  $: if (posts && $bookmarks.games?.length) { seen() } // set read on every change of posts prop (thread re-render)
</script>

<main bind:this={threadEl}>
  {#if isFilledArray($posts)}
    {#each $posts as post, index}
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
    opacity: 0.3;
  }
    .dicePost:hover {
      opacity: 1;
    }

  .pagination {
    text-align: center;
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 22px;
      padding: 15px 25px;
    }
  #replyPreview {
    position: absolute;
    left: 20px;
    min-width: 50vw;
    display: none;
    transform: scale(0.75);
    transform-origin: top left;
    padding: 20px;
  }
  @media (max-width: 860px) {
    #replyPreview {
      width: 150%;
    }
  }
</style>
