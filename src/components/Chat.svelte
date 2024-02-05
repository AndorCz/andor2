<script>
  import { writable } from 'svelte/store'
  import { supabase, handleError } from '@lib/database'
  import { beforeUpdate, afterUpdate, onDestroy } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}

  let textareaValue = ''
  let postsEl
  let inputEl
  let channel

  const posts = writable([])

  beforeUpdate(() => {
    channel = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: '((thread=eq.1))' }, (payload) => {
        $posts.push(payload.new)
        $posts = $posts // update store
      })
      .subscribe()
  })

  afterUpdate(() => { // scroll down
    if (postsEl && $posts.length) { postsEl.lastElementChild.scrollIntoView({ behavior: 'smooth' }) }
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
    await loadPosts()
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
            <div class='postRow'>
              <!-- add tippy for time -->
              <div use:tooltip class='post {post.owner === user.id ? 'mine' : 'theirs'}'>
                <div class='content'>
                  {@html post.content}
                </div>
              </div>
            </div>
            <div class='clear'></div>
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
    .portrait {
      display: block;
      width: 70px;
      height: 70px;
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 2px 2px 3px #0003;
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
      padding: 20px 20px 10px 20px;
    }
      .clear {
        clear: both;
        overflow: auto;
      }
      .postRow {
        margin: 5px 0px;
      }
        .post {
          position: relative;
          max-width: 90%;
          padding: 10px 20px;
        }
          .theirs {
            border-radius: 20px 20px 20px 0px;
            background-color: var(--background);
            text-align: left;
            float: left;
          }
          .mine {
            border-radius: 20px 20px 0px 20px;
            background-color: var(--block);
            color: var(--gray90);
            text-align: right;
            float: right;
          }
</style>
