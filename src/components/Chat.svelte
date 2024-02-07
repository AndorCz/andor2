<script>
  import { writable } from 'svelte/store'
  import { supabase, handleError } from '@lib/database'
  import { tick, onMount, onDestroy } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { formatDate, throttle } from '@lib/utils'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}

  let previousPostsLength = 0
  let textareaValue = ''
  let postsEl
  let inputEl
  let channel

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

  async function loadPosts () {
    const { error, data } = await supabase.from('posts_owner').select('*').eq('thread', 1).order('created_at')
    if (error) { return handleError(error) }
    $posts = data
  }

  async function sendPost () {
    const { error } = await supabase.from('posts').insert({ content: textareaValue, thread: 1, owner: user.id, owner_type: 'user' })
    if (error) { return handleError(error) }
    textareaValue = ''
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
  $: if (postsEl && $posts.length) {
    if (previousPostsLength === 0 && $posts.length > 0) {
      // Instant scroll for the initial load
      postsEl.scrollTop = postsEl.scrollHeight
    } else if (previousPostsLength < $posts.length) {
      // Smooth scroll for subsequent updates (new messages)
      tick().then(() => {
        // Smooth scroll for subsequent updates (new messages)
        postsEl.lastElementChild.scrollIntoView({ behavior: 'smooth' })
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
            {#if post.owner === user.id}
              <div class='postRow mine'>
                <div use:tooltip class='post' title={formatDate(post.created_at)}>
                  <div class='content'>{@html post.content}</div>
                </div>
                {#if post.owner_portrait}<img class='portrait' src={post.owner_portrait} alt={post.owner_name} />{/if}
              </div>
            {:else}
              <div class='postRow theirs'>
                {#if post.owner_portrait}<img class='portrait' src={post.owner_portrait} alt={post.owner_name} />{/if}
                <div use:tooltip class='post' title={formatDate(post.created_at)}>
                  <div class='name'>{post.owner_name}</div>
                  <div class='content'>{@html post.content}</div>
                </div>
              </div>
            {/if}
          {/each}
        {:else}
          <center>Žádné příspěvky</center>
        {/if}
      </div>
      <!-- names of present people -->
      {#if Object.keys($typing).length > 0}
        <div class='typing'>
          {Object.keys($typing).join('píše..., ')} píše...
        </div>
      {/if}
      <TextareaExpandable bind:this={inputEl} bind:value={textareaValue} onSave={sendPost} onTyping={handleTyping} showButton={true} minHeight={70} enterSend />
    {:catch error}
      <span class='error'>Konverzaci se nepodařilo načíst</span>
    {/await}
    <!-- names of present people -->
    {#if Object.keys($people).length > 0}
      <div class='people'>
        Právě přítomní:
        {#each Object.values($people) as person}
          <span class='person'>{person[0].user}</span>
        {/each}
      </div>
    {/if}
  </div>
{/await}

<style>
  #chat {
    height: 600px;
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
      scrollbar-width: thin;
    }
      .postRow {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        margin: 10px 0px;
      }
        .theirs {
          justify-content: flex-start;
        }
        .mine {
          justify-content: flex-end;
        }
          .post {
            position: relative;
            max-width: 88%;
            padding: 10px 20px;
          }
            .name {
              font-weight: bold;
            }
            .portrait {
              display: block;
              min-width: 50px;
              width: 50px;
              height: 50px;
              object-fit: cover;
              object-position: center 20%;
              border-radius: 10px;
              box-shadow: 2px 2px 3px #0003;
            }
              .theirs .post {
                border-radius: 20px 20px 20px 0px;
                background-color: var(--block);
                text-align: left;
              }
              .mine .post {
                border-radius: 20px 20px 0px 20px;
                background-color: var(--prominent);
                color: var(--gray90);
                text-align: right;
              }
    .typing {
      padding: 20px 0px;
    }
    .people {
      margin-top: 20px;
      padding-top: 20px;
    }
      .person {
        padding: 10px;
        margin-left: 5px;
        border-radius: 10px;
        color: var(--accent);
        background-color: var(--block);
      }
</style>
