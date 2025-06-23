<script>
  import { tooltip } from '@lib/tooltip'
  import { writable } from 'svelte/store'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { GoogleGenAI } from '@google/genai'
  import { waitForMediaLoad } from '@lib/utils'
  import { afterUpdate, tick } from 'svelte'
  import { storytellerConfig } from '@lib/solo/gemiini'
  import { supabase, handleError } from '@lib/database-browser'
  import Post from '@components/common/Post.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  export let soloGame = {}
  // export let soloConcept = {}

  const ai = new GoogleGenAI({ apiKey: import.meta.env.PUBLIC_GEMINI })
  const allPosts = writable([])
  const displayedPosts = writable([])
  const displayIncrement = 50
  let chat
  let inputEl
  let postsEl
  let inputValue = ''
  let isLoading = false
  let hasMorePosts = true
  let displayedCount = 50
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
        // Show more posts from the already loaded set
        const scrollHeight = postsEl.scrollHeight
        const scrollPosition = postsEl.scrollTop

        // Increase the number of posts to display
        displayedCount += displayIncrement
        updateDisplayedPosts()

        // After the DOM updates, restore the scroll position
        tick().then(() => {
          const newScrollHeight = postsEl.scrollHeight
          postsEl.scrollTop = scrollPosition + (newScrollHeight - scrollHeight)
        })
      }
    }
  }

  // Function to update which posts are displayed based on the display count
  function updateDisplayedPosts () {
    if ($allPosts.length <= displayedCount) {
      // If we have fewer posts than the display count, show all
      $displayedPosts = [...$allPosts]
      hasMorePosts = false
    } else {
      // Show only the most recent posts
      $displayedPosts = $allPosts.slice(-displayedCount)
      hasMorePosts = true
    }
  }

  async function loadPosts () {
    isLoading = true
    try {
      const { data, error } = await supabase.from('posts').select().match({ thread: soloGame.thread }).order('created_at', { ascending: true })
      if (error) { return handleError(error) }
      $allPosts = data || []
      initAIChat(data)
      updateDisplayedPosts()
    } finally {
      isLoading = false
    }
  }

  async function initAIChat (posts) {
    const history = posts.map(post => ({ role: post.owner_type === 'user' ? 'user' : 'model', parts: [{ text: post.content }] }))
    chat = ai.chats.create({ model: 'gemini-2.5-flash', history, config: storytellerConfig })

    /*
    const stream1 = await chat.sendMessageStream({
      message: "I have 2 dogs in my house."
    })
    for await (const chunk of stream1) {
      console.log(chunk.text)
      console.log("_".repeat(80))
    }

    const stream2 = await chat.sendMessageStream({
      message: "How many paws are in my house?"
    })
    for await (const chunk of stream2) {
      console.log(chunk.text)
      console.log("_".repeat(80))
    }
    */
  }

  async function addPost () {
    if (inputValue.trim() === '') return
    const { data: newPostData, error } = await supabase.from('posts').insert({ thread: soloGame.thread, owner: user.id, owner_type: 'user', content: inputValue }).select()
    if (error) { return handleError(error) }
    inputValue = ''

    // Add the new post to both stores
    $allPosts = [...$allPosts, ...newPostData]
    $displayedPosts = [...$displayedPosts, ...newPostData]
  }

  // Reactive statement for scrolling
  $: {
    if (postsEl && $displayedPosts.length) {
      if (!userHasScrolledUp) { // Scroll to bottom for new posts from the other user, or on initial load if not scrolled up
        if (previousPostsLength === 0 && $displayedPosts.length > 0) { // Initial load
          postsEl.scrollTop = postsEl.scrollHeight
        } else { // New message
          waitForMediaLoad(postsEl).then(() => {
            if (postsEl) { postsEl.scrollTo({ top: postsEl.scrollHeight, behavior: 'smooth' }) }
          })
        }
      }
      previousPostsLength = $displayedPosts.length
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
        {#if isLoading && !$displayedPosts.length}
          <div class='info'>Načítám příspěvky...</div>
        {:else if hasMorePosts}
          <div class='info'>{#if isLoading}Načítám starší příspěvky...{:else}Scrollujte nahoru pro načtení starších příspěvků{/if}</div>
        {/if}
        {#if $displayedPosts.length > 0}
          {#each $displayedPosts as post (post.id)}
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
      justify-content: flex-end;
      max-height: 100svh;
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
        height: 50svh;
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
