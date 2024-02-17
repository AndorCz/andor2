<script>
  import { onMount } from 'svelte'
  import { setRead, getReply } from '@lib/database'
  import { isFilledArray } from '@lib/utils'
  import { tooltipContent } from '@lib/tooltip'
  import Post from '@components/common/Post.svelte'

  export let id
  export let user
  export let posts
  export let unread = 0
  export let canDeleteAll = false
  export let canModerate = false
  export let myIdentities = []
  export let allowReactions
  export let onDelete
  export let onEdit
  export let onModerate
  export let onReply
  export let onPaging
  export let page = 0
  export let pages
  export let iconSize = 140

  let threadEl
  let replyPostEl
  let replyPostData
  const replies = {}

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

  function showReply (event) {
    const id = parseInt(event.target.getAttribute('data-id'))
    replyPostData = replies[id]
    if (replyPostData) {
      replyPostEl.style.display = 'block'
      replyPostEl.style.top = event.target.offsetTop + 30 + 'px'
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

  $: if (posts) { setRead(user.id, 'thread-' + id) } // set read on every change of posts prop (thread re-render)
</script>

<main bind:this={threadEl}>
  {#if isFilledArray($posts)}
    {#each $posts as post, index}
      {#if post.dice}
        <span class='dicePost' use:tooltipContent={{ maxWidth: 'none' }}>
          <Post {post} {user} {allowReactions} {canDeleteAll} {iconSize} {onDelete} isMyPost={isMyPost(post.owner)} />
        </span>
      {:else}
        <Post {post} unread={index < unread} {user} {allowReactions} {canDeleteAll} {iconSize} {onReply} {onDelete} {onEdit} {onModerate} isMyPost={isMyPost(post.owner)} {canModerate} />
      {/if}
    {/each}
    <div class='pagination'>
      {#each { length: pages } as _, i}
        <button on:click={() => { triggerPaging(i) } } disabled={i === page}>{i + 1}</button>
      {/each}
    </div>
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
    margin-top: 50px;
  }
    center {
      padding-top: 50px;
    }

  .dicePost {
    display: inline-block;
    width: 50px;
    height: 50px;
    margin: 5px;
    margin-left: 0px;
    background-image: url('/dice/d10.png');
    background-size: 75% 75%;
    background-repeat: no-repeat;
    background-position: center;
    cursor: pointer;
    opacity: 0.5;
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
    transform: scale(0.5);
    transform-origin: top left;
    padding: 20px;
  }
  @media (max-width: 860px) {
    #replyPreview {
      width: 150%;
    }
  }
</style>
