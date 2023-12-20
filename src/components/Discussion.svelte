<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { getGameStore } from '@lib/stores'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  export let data
  export let isGameOwner
  
  let posts = []
  let saving = false
  let textareaValue = ''
  let identitySelect

  const gameStore = getGameStore(data.id)

  onMount(() => {
    $gameStore.activeChatIdentity = $gameStore.activeChatIdentity || data.identities[0].id
    identitySelect.value = $gameStore.activeChatIdentity
    loadPosts()
  })

  async function loadPosts () {
    const { data: postData, error } = await supabase.from('posts_owner').select('id, owner, owner_name, owner_portrait, created_at, content').eq('thread', data.discussion).order('created_at', { ascending: false })
    if (error) { return handleError(error) }
    posts = postData
  }

  function getIdentity (id) {
    return data.identities.find((identity) => { return identity.id === id })
  }

  async function submitPost (e) {
    saving = true
    e.preventDefault()
    if (textareaValue.trim().length === 0) { return showError('Příspěvek nesmí být prázdný') }
    const identity = getIdentity($gameStore.activeChatIdentity)
    const { error } = await supabase.from('posts').insert({ content: textareaValue, thread: data.discussion, owner: identity.id, owner_type: identity.type })
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
  <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} />
  <div class='senderWrapper'>
    <select size='4' bind:this={identitySelect} bind:value={$gameStore.activeChatIdentity}>
      {#each data.identities as identity}
        <option value={identity.id}>{identity.name}</option>
      {/each}
    </select>
  </div>
</div>

<Thread posts={posts} canDeleteAll={isGameOwner} myIdentities={data.identities} />

<style>

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

</style>