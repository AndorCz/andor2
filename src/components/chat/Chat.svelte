<script>
  import { writable } from 'svelte/store'
  import { tick, onMount, onDestroy } from 'svelte'
  import { supabase, handleError, sendPost } from '@lib/database-browser'
  import { throttle } from '@lib/utils'
  import { showSuccess, showError } from '@lib/toasts'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import ChatPost from '@components/chat/ChatPost.svelte'

  export let user = {}

  let previousPostsLength = 0
  let textareaValue = ''
  let textareaRef
  let postsEl
  let channel
  let editing = false
  let saving = false

  const people = writable({})
  const typing = writable({})
  const posts = writable([])

  onMount(() => {
    channel = supabase.channel('chat', { config: { presence: { key: user.id } } })
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: 'thread=eq.1' }, (payload) => {
        loadPosts()
      })
      .on('presence', { event: 'sync' }, () => { // sync is called on every presence change
        const newState = channel.presenceState()
        $people = newState
      })
      .on('broadcast', { event: 'typing' }, (data) => { // triggered when someone is typing
        $typing[data.payload.user] = true
        removeTyping(data.payload.user)
      })
      /*
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('somebody joined', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('somebody left', key, leftPresences)
      })
      */

    const userStatus = { user: user.name, online_at: new Date().toISOString() }

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') { return }
      await channel.track(userStatus)
    })
  })

  onDestroy(() => { if (channel) { supabase.removeChannel(channel) } })

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  function onEdit (id, content) {
    editing = id
    textareaValue = content
    textareaRef.triggerEdit(id, content)
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

  async function loadPosts () {
    const query = await supabase.rpc('get_discussion_posts', { user_id: user.id, _thread: 1, page: 0, _limit: 1000, ascending: true })
    const { data: rpcData, error } = await query
    if (error) { handleError(error) } else {
      $posts = rpcData.postdata
    }
  }

  async function submitPost () {
    if (saving || textareaValue === '') { return }
    saving = true
    let response
    if (editing) {
      response = await sendPost('PATCH', { id: editing, thread: 1, content: textareaValue, owner: user.id, ownerType: 'user' })
    } else {
      response = await sendPost('POST', { thread: 1, content: textareaValue, owner: user.id, ownerType: 'user' })
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
      delete $typing[name]
      $typing = $typing
    }, 3000)
  }

  const handleTyping = throttle(() => {
    channel.send({ type: 'broadcast', event: 'typing', payload: { user: user.name } })
  }, 3000)

  // Reactive statement for scrolling
  $: if (postsEl && $posts?.length) {
    if (previousPostsLength === 0 && $posts.length > 0) {
      // Instant scroll for the initial load
      setTimeout(() => { postsEl.scrollTop = postsEl.scrollHeight }, 10)
      // postsEl.scrollTop = postsEl.scrollHeight
    } else if (previousPostsLength < $posts.length) {
      // Smooth scroll for subsequent updates (new messages)
      tick().then(() => {
        // Smooth scroll to the bottom
        setTimeout(() => { postsEl.scrollTo({ top: postsEl.scrollHeight, behavior: 'smooth' }) }, 10)
        previousPostsLength = $posts.length // update count
      })
    }
    previousPostsLength = $posts.length // Update the length after scrolling
  }
</script>

{#await waitForAnimation() then}
  <div id='chat'>
    {#await loadPosts()}
      <span class='loading'>Načítám...</span>
    {:then}
      <div class='posts' bind:this={postsEl}>
        {#if $posts.length > 0}
          {#each $posts as post}
            <ChatPost {user} {post} {onEdit} {onDelete} />
          {/each}
        {:else}
          <center>Žádné příspěvky</center>
        {/if}
      </div>
      <div id='textareaWrapper'>
        <!-- names of present people -->
        {#if Object.keys($typing).length > 0}
          <div class='typing'>
            {Object.keys($typing).join('píše..., ')} píše...
          </div>
        {/if}
        <TextareaExpandable userId={user.id} bind:this={textareaRef} bind:value={textareaValue} bind:editing={editing} disabled={saving} onSave={submitPost} onTyping={handleTyping} showButton={true} minHeight={30} enterSend singleLine disableEmpty />
      </div>
    {:catch error}
      <span class='error'>Konverzaci se nepodařilo načíst</span>
    {/await}
    <!-- names of present people -->
    {#if Object.keys($people).length > 0}
      <div class='people'>
        Právě přítomní:
        {#each Object.values($people) as person}
          <span class='person user'>{person[0].user}</span>
        {/each}
      </div>
    {/if}
  </div>
{/await}

<style>
  #chat {
    height: 1000px;
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
      margin-bottom: 30px;
      scrollbar-width: thin;
    }

    #textareaWrapper {
      position: relative;
    }
      .typing {
        position: absolute;
        top: -35px;
        left: 5px;
      }
    .people {
      margin-top: 20px;
      padding-top: 20px;
    }
      .person {
        padding: 10px;
        margin-left: 5px;
        border-radius: 10px;
        background-color: var(--block);
      }

  @media (max-width: 500px) {
    #chat {
      height: calc(100svh - 180px);
    }
    .people {
      margin-top: 5px;
      padding-top: 10px;
      height: 60px;
    }
  }
</style>
