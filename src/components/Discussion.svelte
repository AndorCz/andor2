<script>
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { onMount } from 'svelte'

  export let thread
  
  let posts = []
  let textarea
  let saving = false

  onMount(loadPosts)

  async function loadPosts () {
    const { data, error } = await supabase.from('posts').select('*').eq('thread', thread).order('created_at', { ascending: false })
    if (error) { return handleError(error) }
    posts = data
  }

  async function submitPost (e) {
    saving = true
    e.preventDefault()
    const content = textarea.value
    if (textarea.value.trim().length === 0) { return showError('Příspěvek nesmí být prázdný') }

    const { error } = await supabase.from('posts').insert({ content, thread })
    if (error) { return handleError(error) }
    textarea.value = ''
    await loadPosts()
    saving = false
  }
</script>

<div class='wrapper'>
  <textarea bind:this={textarea}></textarea>
  <button on:click={submitPost} disabled={saving}><span class='material-symbols-rounded'>send</span></button>
</div>

<center>
  {#each posts as post}
    <div class='post'>
      <div class='header'>
        <span class='name'></span>
        <span class='time'>{new Date(post.created_at).toLocaleString('cs-CZ')}</span>
      </div>
      <!--
      <div class='icon'>
        <img src={post.profiles.avatar} alt={post.profiles.name} />
      </div>
      -->
      <div class='content'>
        <p>{post.content}</p>
      </div>
    </div>
  {:else}
    Žádné příspěvky
  {/each}
</center>

<style>
  .wrapper {
    position: relative;
  }
    textarea {
      width: 100%;
      height: auto;
      min-height: 100px;
      display: block;
      padding-right: 80px;
    }
    button {
      position: absolute;
      bottom: 0px;
      right: 0px;
      border-radius: 0px;
      padding: 15px 20px;
      border-radius: 10px 0px 10px 0px;
    }
  center {
    margin-top: 100px;
  }
    .post {
      width: 100%;
      margin-bottom: 20px;
      padding: 20px;
      background-color: var(--block);
      text-align: left;
    }
      .header {
        display: flex;
        justify-content: space-between;
      }
        .time {
          color: var(--dim);
        }
</style>