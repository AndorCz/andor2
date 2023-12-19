<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { getGameStore } from '@lib/stores'
  import TextareaExpandable from '@components/misc/TextareaExpandable.svelte'

  export let discussion
  export let identities
  export let identityStore
  
  let posts = []
  let saving = false
  let textareaValue = ''
  let identitySelect

  onMount(() => {
    loadPosts()
    if ($identityStore.activeChatIdentity) { identitySelect.value = $identityStore.activeChatIdentity }
  })

  async function loadPosts () {
    const { data, error } = await supabase.from('posts_owner').select('id, owner_name, owner_portrait, created_at, content').eq('thread', discussion).order('created_at', { ascending: false })
    if (error) { return handleError(error) }
    posts = data
  }

  async function submitPost (e) {
    saving = true
    e.preventDefault()
    if (textareaValue.trim().length === 0) { return showError('Příspěvek nesmí být prázdný') }
    const identity = identitySelect.value ? identities[identitySelect.value] : Object.values(identities)[0]
    const { error } = await supabase.from('posts').insert({ content: textareaValue, thread: discussion, owner: identity.id, owner_type: identity.type })
    if (error) { return handleError(error) }
    textareaValue = ''
    await loadPosts()
    saving = false
  }

  function onSelect (e) { $identityStore.activeChatIdentity = e.target.value }
</script>

<h2>Veřejná diskuze</h2>

<div class='headlines'>
  <h3 class='text'>Přidat příspěvek</h3>
  <h3 class='sender'>Identita</h3>
</div>
<div class='addPostWrapper'>
  <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} />
  <div class='senderWrapper'>
    <select size='4' bind:this={identitySelect} on:change={onSelect}>
      {#each Object.keys(identities) as identity}
        <option>{identity}</option>
      {/each}
    </select>
  </div>
</div>

<center>
  {#each posts as post}
    <div class='post'>
      {#if post.owner_portrait}
        <div class='icon'>
          <img src={post.owner_portrait} alt={post.owner_name} />
        </div>
      {/if}
      <div class='body'>
        <div class='header'>
          <span class='name'>{post.owner_name}</span>
          <span class='time'>{new Date(post.created_at).toLocaleString('cs-CZ')}</span>
        </div>
        <div class='content'>
          {post.content}
        </div>
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
      display: flex;
      width: 100%;
      margin-bottom: 20px;
      text-align: left;
      gap: 10px;
    }
      .icon {
        width: 140px;
      }
        .icon img {
          width: 100%;
          display: block;
        }
    
    .body {
      flex: 1;
    }
    .content {
        background-color: var(--block);
        padding: 20px;
      }
      .header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        background-color: var(--prominent);
        padding: 10px 15px;
        box-shadow: 2px 2px 3px #0002;
      }
        .name {
          font-weight: bold;
        }
        .time {
          color: var(--dim);
        }
</style>