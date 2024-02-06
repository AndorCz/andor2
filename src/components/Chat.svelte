<script>
  import { writable } from 'svelte/store'
  import { supabase, handleError } from '@lib/database'
  import { tick, onMount, onDestroy } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { formatDate } from '@lib/utils'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}

  let previousPostsLength = 0
  let textareaValue = ''
  let postsEl
  let inputEl
  let channel

  const posts = writable([])

  onMount(() => {
    channel = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: 'thread=eq.1' }, (payload) => {
        loadPosts()
        // $posts.push(payload.new)
        // $posts = $posts // update store
      })
      .subscribe()
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

  // Reactive statement for scrolling
  $: if (postsEl && $posts.length) {
    if (previousPostsLength === 0 && $posts.length > 0) {
      console.log('initial load')
      // Instant scroll for the initial load
      postsEl.scrollTop = postsEl.scrollHeight
    } else if (previousPostsLength < $posts.length) {
      console.log('new post')
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
      <TextareaExpandable bind:this={inputEl} bind:value={textareaValue} onSave={sendPost} showButton={true} minHeight={70} enterSend />
    {:catch error}
      <span class='error'>Konverzaci se nepodařilo načíst</span>
    {/await}
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
            .content {
              font-size: 19px;
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
</style>
