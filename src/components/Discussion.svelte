<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, sendPost } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { getGameStore } from '@lib/stores'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  export let data
  export let isGameOwner

  let posts = []
  let textareaValue = ''
  let identitySelect
  let saving = false
  let editing = false

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

  async function submitPost () {
    saving = true
    const identity = getIdentity($gameStore.activeChatIdentity)
    await sendPost({ thread: data.discussion, content: textareaValue, owner: identity.id, ownerType: identity.type })
    textareaValue = ''
    await loadPosts()
    saving = false
  }

  async function deletePost (id) {
    if (!window.confirm('Opravdu smazat příspěvek?')) { return }
    const res = await fetch(`/api/post?id=${id}&thread=${data.openai_thread}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    showSuccess('Příspěvek smazán')
    await loadPosts()
  }

  async function editPost (id, content) {
    editing = true
    textareaValue = content
  }
</script>

<h2>Veřejná diskuze</h2>

<div class='headlines'>
  <h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
  <h3 class='sender'>Identita</h3>
</div>
<div class='addPostWrapper'>
  <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} />
  <div class='senderWrapper'>
    <select size='4' bind:this={identitySelect} bind:value={$gameStore.activeChatIdentity}>
      {#each data.identities as identity}
        <option value={identity.id}>{identity.name}</option>
      {/each}
    </select>
  </div>
</div>

<Thread {posts} canDeleteAll={isGameOwner} myIdentities={data.identities} onDelete={deletePost} onEdit={editPost} />

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
