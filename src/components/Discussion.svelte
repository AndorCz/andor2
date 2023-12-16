<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import TextareaExpandable from '@components/misc/TextareaExpandable.svelte'

  export let thread
  
  let posts = []
  let textareaValue = ''
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
    if (textareaValue.trim().length === 0) { return showError('Příspěvek nesmí být prázdný') }

    const { error } = await supabase.from('posts').insert({ content: textareaValue, thread })
    if (error) { return handleError(error) }
    textareaValue = ''
    await loadPosts()
    saving = false
  }
</script>

<h2>Veřejná diskuze</h2>

<div class='headlines'>
  <h3 class='text'>Přidat příspěvek</h3>
  <h3 class='sender'>Identita</h3>
</div>
<div class='addPostWrapper'>
  <TextareaExpandable value={textareaValue} disabled={saving} onSave={submitPost} />
  <div class='senderWrapper'>
    <select size='4'>
      <option>A</option>
      <option>B</option>
    </select>
  </div>
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
  /* input */
  .addPostWrapper {
    display: flex;
    width: 100%;
    gap: 20px;
  } 
    .textareaWrapper {
      position: relative;
      flex: 1;
      display: flex;
    }
      textarea {
        width: 100%;
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
      select {
        background: none;
      }
    .senderWrapper select {
      width: 200px;
    }
  .headlines {
    display: flex;
  }
    .headlines .text {
      flex: 1;
    }
    .headlines .sender {
      width: 200px;
    }

  /* posts */
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