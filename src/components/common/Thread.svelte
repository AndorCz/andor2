<script>
  import { onMount } from 'svelte'
  import { isFilledArray } from '@lib/utils'
  import { setRead } from '@lib/helpers'
  import { tooltipContent } from '@lib/tooltip'
  import Post from '@components/common/Post.svelte'

  export let id
  export let user
  export let posts
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

  onMount(() => { if (user.id) { setRead(user.id, 'thread-' + id) } })

  function isMyPost (id) {
    return myIdentities.find((identity) => { return identity.id === id })
  }

  function triggerPaging (newPage) {
    page = newPage
    onPaging(page)
    threadEl.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<main bind:this={threadEl}>
  {#if isFilledArray($posts)}
    {#each $posts as post}
      {#if post.dice}
        <span class='dicePost' use:tooltipContent={{ maxWidth: 'none' }}>
          <Post {post} {user} {allowReactions} {canDeleteAll} {iconSize} {onDelete} isMyPost={isMyPost(post.owner)} />
        </span>
      {:else}
        <Post {post} {user} {allowReactions} {canDeleteAll} {iconSize} {onReply} {onDelete} {onEdit} {onModerate} isMyPost={isMyPost(post.owner)} {canModerate} />
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
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 22px;
      padding: 15px 25px;
    }
</style>
