<script>
  import Post from '@components/common/Post.svelte'
  import { tick } from 'svelte'
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { platform } from '@components/common/MediaQuery.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import { waitForMediaLoad } from '@lib/utils'
  import { supabase, handleError } from '@lib/database-browser'
  import { showSuccess, showError } from '@lib/toasts'

  const { user = {}, game = {}, character = {}, storyteller = {}, concept = {}, readonly } = $props()

  let inputEl = $state(null)
  let postsEl = $state(null)
  let allPosts = $state([])
  let isLoading = $state(true)
  let inputValue = $state('')
  let isGenerating = $state(false)
  let hasMorePosts = $state(true)
  let displayedPosts = $state([])
  let displayedCount = $state(50)
  let userHasScrolledUp = $state(false)
  let distanceFromBottom = $state(0)
  let previousPostsLength = 0

  const displayIncrement = 50

  onMount(async () => {
    await loadPosts()
    // Attach scroll listener after posts are loaded
    if (postsEl) { postsEl.addEventListener('scroll', handleScroll) }
    return () => { if (postsEl) { postsEl.removeEventListener('scroll', handleScroll) } }
  })

  async function loadPosts () {
    isLoading = true
    const { data, error } = await supabase.from('posts_owner').select().match({ thread: game.thread }).order('created_at', { ascending: true })
    if (error) { return handleError(error) }
    allPosts = data
    updateDisplayedPosts()
    isLoading = false
  }

  async function addPost () {
    if (inputValue.trim() === '') return
    if (isGenerating) return // Prevent multiple submissions while generating
    const { data: newPostData, error } = await supabase.from('posts').insert({ thread: game.thread, owner: character.id, owner_type: 'character', content: inputValue }).select().single()
    newPostData.owner_name = character.name
    newPostData.owner_portrait = character.portrait
    if (error) { return handleError(error) }
    inputValue = ''

    // Add the new user post to both stores
    allPosts.push(newPostData)
    displayedPosts.push(newPostData)

    await generateResponse()
  }

  // Generate AI response via backend
  async function generateResponse () {
    if (isGenerating) return // Prevent multiple generations
    isGenerating = true
    const tempAiPost = { id: `temp-${Date.now()}`, owner: storyteller.id, owner_type: 'npc', owner_name: storyteller.name, owner_portrait: storyteller.portrait, content: '', created_at: new Date().toISOString() }
    allPosts.push(tempAiPost)
    displayedPosts.push(tempAiPost)
    const reactiveAiPost = displayedPosts.at(-1)

    try {
      const res = await fetch('/api/solo/generatePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soloId: game.id })
      })
      if (!res.ok) { throw new Error(`HTTP error, status: ${res.status}`) }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        text.split('\n\n').forEach(line => {
          const match = line.match(/^data: (.*)$/)
          if (match) {
            reactiveAiPost.content += match[1].replace(/\[line-break\]/g, '\n')
            postsEl.scrollTop = postsEl.scrollHeight
          }
        })
      }
      // Post complete, look up it's ID and update the post
      const { data: realPost, error } = await supabase.from('posts').select().match({ thread: game.thread, owner: storyteller.id, owner_type: 'npc', content: reactiveAiPost.content }).single()
      if (error) { return handleError(error) }
      console.log('real post', realPost)
      reactiveAiPost.id = realPost.id // Update the temporary post with the real post ID
      // const index = allPosts.findIndex(post => post.id === tempAiPost.id)
      // if (index !== -1) { allPosts[index].id = realPost.id }
    } catch (err) {
      handleError(err)
    } finally {
      isGenerating = false
    }
  }

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  function showConcept () {
    window.location.href = `/solo/concept/${concept.id}`
  }

  function handleScroll () {
    distanceFromBottom = postsEl.scrollHeight - postsEl.scrollTop - postsEl.clientHeight
    userHasScrolledUp = distanceFromBottom > 50 // Threshold to consider as manual scroll
    if (postsEl && hasMorePosts) {
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
    if (allPosts.length <= displayedCount) {
      // If we have fewer posts than the display count, show all
      displayedPosts = [...allPosts]
      hasMorePosts = false
    } else {
      // Show only the most recent posts
      displayedPosts = allPosts.slice(-displayedCount)
      hasMorePosts = true
    }
  }

  // Reactive statement for scrolling
  $effect(async () => {
    if (postsEl && displayedPosts.length > 1) { // Skip for first post
      if (!userHasScrolledUp) { // Scroll to bottom for new posts from the other user, or on initial load if not scrolled up
        await waitForMediaLoad(postsEl)
        if (previousPostsLength === 0 && displayedPosts.length > 1) { // Initial load
          postsEl.scrollTop = postsEl.scrollHeight
        } else { // New message
          if (postsEl) { postsEl.scrollTo({ top: postsEl.scrollHeight, behavior: 'smooth' }) }
        }
      }
      previousPostsLength = displayedPosts.length
    } else {
      previousPostsLength = 0
    }
  })

  async function onDelete (post) {
    if (window.confirm('Opravdu smazat příspěvek?')) {
      const res = await fetch(`/api/post?id=${post.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
      showSuccess('Příspěvek smazán')
      await loadPosts()
    }
  }
</script>

<main>
  <div class='headline'>
    <h1>{game.name}</h1>
    <div class='buttons'>
      <div class='limit' title='Denní limit počtu odpovědí od AI vypravěče' use:tooltip>5</div>
      <button onclick={showConcept} class='material square back' title='Koncept hry' use:tooltip>info</button>
      {#if user.id}
        <button onclick={showSettings} class='material settings square' title='Nastavení hry' use:tooltip>settings</button>
      {/if}
    </div>
  </div>
  <div class='content'>
    <div class='posts' bind:this={postsEl}>
      {#if isLoading}
        <center class='info'>Načítání...</center>
      {:else}
        {#if displayedPosts.length > 0}
          {#each displayedPosts as post, index (post.id)}
            <Post {post} {user} canDeleteAll={typeof post.id !== 'string' && index === displayedPosts.length - 1} iconSize={$platform === 'desktop' ? 70 : 40} isMyPost={post.owner === user.id} showEdited={false} {onDelete} />
          {/each}
          <!-- last post is by the user -->
          {#if displayedPosts[displayedPosts.length - 1].owner_type === 'character' && !isGenerating}
            <center><button onclick={generateResponse}>Pokračovat</button></center>
          {/if}
        {:else}
          <center class='info empty'>Žádné příspěvky</center>
        {/if}
      {/if}
    </div>
    {#if !readonly}
      <div class='input'>
        <TextareaExpandable {user} bind:this={inputEl} bind:value={inputValue} onSave={addPost} loading={isGenerating} disabled={isGenerating} singleLine enterSend showButton disableEmpty placeholder='Co uděláš?' />
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
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
        .buttons {
          display: flex;
          flex: 0.1;
          gap: 10px;
        }
      .posts {
        flex: 1;
        overflow-y: auto;
        padding-right: 10px;
        margin-bottom: 10px;
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
  .input {
    padding: 0px 5px;
  }
  .limit {
    display: inline-block;
    width: 46px;
    height: 46px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: monospace;
    background-color: var(--background);
    color: var(--accent);
    border-radius: 8px;
    padding: 7px;
    font-weight: bold;
    font-size: 25px;
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
    .headline {
      margin-top: 0px;
      padding-bottom: 0px;
    }
    .buttons {
      display: flex;
      flex-direction: column;
      flex: 0.1;
      gap: 5px;
    }
      .buttons button, .buttons .limit {
        width: 35px;
        height: 35px;
        font-size: 20px;
        padding: 0px;
      }
  }
</style>
