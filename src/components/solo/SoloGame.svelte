<script>
  import { tooltip } from '@lib/tooltip'
  import { writable } from 'svelte/store'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { waitForMediaLoad } from '@lib/utils'
  import { afterUpdate, tick } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import Post from '@components/common/Post.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  export let soloGame = {}
  // export let soloConcept = {}

  const posts = writable([])
  const pageSize = 20
  let inputEl
  let postsEl
  let inputValue = ''
  let isLoading = false
  let hasMorePosts = true
  let postOffset = 0
  let userHasScrolledUp = false
  let distanceFromBottom = 0
  let previousPostsLength = 0
  let scrollHandlerAttached = false

  // Ensure the scroll handler is attached after the component is mounted and updated
  afterUpdate(() => {
    if (postsEl && !scrollHandlerAttached) {
      postsEl.addEventListener('scroll', handleScroll)
      scrollHandlerAttached = true
    }
  })

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  function handleScroll () {
    distanceFromBottom = postsEl.scrollHeight - postsEl.scrollTop - postsEl.clientHeight
    userHasScrolledUp = distanceFromBottom > 50 // Threshold to consider as manual scroll
    if (postsEl && hasMorePosts && !isLoading) {
      if (postsEl.scrollTop <= 50) { // 50px threshold from top
        loadPosts(false) // Load more messages, not initial load
      }
    }
  }

  async function loadPosts (initialLoad = true) {
    isLoading = true
    try {
      if (initialLoad) {
        postOffset = 0
        hasMorePosts = true
        $posts = []
      }

      const { data, error } = await supabase.from('posts').select('*').match({ thread: soloGame.thread }).order('created_at', { ascending: false }).range(postOffset, postOffset + pageSize - 1)
      if (error) { return handleError(error) }

      hasMorePosts = data && data.length >= pageSize // Check if we have more posts to load
      postOffset += data?.length || 0 // Update offset for next page load

      // Add posts to the store (newest posts are loaded first, so we need to prepend them)
      if (initialLoad) {
        // Reverse to get chronological order (oldest first)
        $posts = data ? data.reverse() : []
      } else if (data && data.length > 0) {
        // When loading more (older) posts, add them to the beginning
        const scrollHeight = postsEl.scrollHeight
        const scrollPosition = postsEl.scrollTop

        // Prepend older posts to the beginning
        $posts = [...data.reverse(), ...$posts]

        // After the DOM updates, restore the scroll position
        await tick() // ensure DOM is updated
        const newScrollHeight = postsEl.scrollHeight
        postsEl.scrollTop = scrollPosition + (newScrollHeight - scrollHeight)
      }
    } finally {
      isLoading = false
    }
  }

  async function addPost () {
    if (inputValue.trim() === '') return
    const { data: newPostData, error } = await supabase.from('posts').insert({ thread: soloGame.thread, owner: user.id, owner_type: 'user', content: inputValue }).select()
    if (error) { return handleError(error) }
    inputValue = ''
    $posts = [...$posts, ...newPostData]
  }

  // Reactive statement for scrolling
  $: {
    if (postsEl && $posts.length) {
      if (!userHasScrolledUp) { // Scroll to bottom for new posts from the other user, or on initial load if not scrolled up
        if (previousPostsLength === 0 && $posts.length > 0) { // Initial load
          postsEl.scrollTop = postsEl.scrollHeight
        } else { // New message
          waitForMediaLoad(postsEl).then(() => {
            if (postsEl) {
              postsEl.scrollTo({ top: postsEl.scrollHeight, behavior: 'smooth' })
            }
          })
        }
      }
      previousPostsLength = $posts.length
    } else {
      previousPostsLength = 0
    }
  }
</script>

<main>
  <div class='headline'>
    <h1>{soloGame.name}</h1>
    {#if user.id}
      <button on:click={showSettings} class='material settings square' title='Nastavení hry' use:tooltip>settings</button>
    {/if}
  </div>
  <div class='content'>
    {#await loadPosts()}
      <div class='info'>Načítám příspěvky...</div>
    {:then}
      <div class='posts' bind:this={postsEl} on:scroll={handleScroll}>
        {#if isLoading && !$posts.length}
          <div class='info'>Načítám příspěvky...</div>
        {:else if hasMorePosts}
          <div class='info'>{#if isLoading}Načítám starší příspěvky...{:else}Scrollujte nahoru pro načtení starších příspěvků{/if}</div>
        {/if}
        {#if $posts.length > 0}
          {#each $posts as post (post.id)}
            <Post {post} {user} iconSize={$platform === 'desktop' ? 70 : 40} isMyPost={post.owner === user.id} />
          {/each}
        {:else}
          <center class='info empty'>Žádné příspěvky</center>
        {/if}
      </div>
      <TextareaExpandable {user} bind:this={inputEl} bind:value={inputValue} onSave={addPost} singleLine enterSend showButton disableEmpty placeholder='Co uděláš?' />
    {/await}
  </div>
</main>

<style>
  main {
    position: relative;
    height: calc(100svh - 40px);
    display: flex;
    flex-direction: column;
  }
    .headline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      gap: 10px;
    }
      h1 {
        margin: 0px;
        flex: 1;
      }
    .content {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
    .posts {
      flex-grow: 1;
      display: flex;
      overflow-y: auto;
      padding-right: 10px;
      margin-bottom: 10px;
      flex-direction: column;
      border-top: 1px var(--block) solid;
    }
      .info {
        display: block;
        text-align: center;
        padding: 20px;
        font-style: italic;
        color: var(--text-muted);
      }
      .empty {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

  @media (max-width: 1200px) {
    .headline {
      margin-top: 20px;
    }
  }

  @media (max-width: 860px) {
    .content {
      padding: 10px;
    }
  }

  @media (max-width: 500px) {
    .content {
      padding: 10px 0px;
    }
  }
</style>
