<script>
  import { writable } from 'svelte/store'
  import { supabase, handleError } from '@lib/database'
  import { beforeUpdate, afterUpdate, onDestroy } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { formatDate } from '@lib/utils'
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
    setTimeout(() => {
      if (postsEl && $posts.length) { postsEl.lastElementChild.scrollIntoView({ behavior: 'smooth' }) }
    }, 10)
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
              {#if post.owner === user.id}
                <div use:tooltip={{ placement: 'left' }} class='post mine' title={formatDate(post.created_at)}>
                  <div class='content'>{@html post.content}</div>
                  {#if post.owner_portrait}<img class='portrait' src={post.owner_portrait} alt={post.owner_name} />{/if}
                </div>
              {:else}
                <div use:tooltip={{ placement: 'right' }} class='post theirs' title={formatDate(post.created_at)}>
                  {#if post.owner_portrait}<img class='portrait' src={post.owner_portrait} alt={post.owner_name} />{/if}
                  <div class='name'>{post.owner_name}:</div>
                  <div class='content'>{@html post.content}</div>
                </div>
              {/if}
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
      .clear {
        clear: both;
        overflow: auto;
      }
      .postRow {
        margin: 10px 0px;
      }
        .post {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          max-width: 90%;
          padding: 10px 20px;
        }
          .portrait {
            margin: -15px;
            display: block;
            min-width: 50px;
            width: 50px;
            height: 50px;
            object-fit: cover;
            object-position: center 20%;
            border-radius: 10px;
            box-shadow: 2px 2px 3px #0003;
          }
          .theirs {
            border-radius: 20px 20px 20px 0px;
            background-color: var(--block);
            text-align: left;
            float: left;
          }
            .theirs .portrait {
              margin-right: 0px;
            }
          .mine {
            border-radius: 20px 20px 0px 20px;
            background-color: var(--prominent);
            color: var(--gray90);
            text-align: right;
            float: right;
          }
            .mine .portrait {
              margin-left: 0px;
            }
</style>
