<script>
  import { onMount } from 'svelte'
  import { getGameStore } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { sendPost } from '@lib/helpers'
  import { showSuccess, showError } from '@lib/toasts'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  export let user = {}
  export let data = {}
  export let isGameOwner

  let posts = []
  let textareaValue = ''
  let identitySelect
  let audienceSelect
  let saving = false
  let editing = false

  let activeGameAudienceIds = [] // temp

  const gameStore = getGameStore(data.id)

  const myCharacters = data.characters.filter((char) => { return char.accepted && char.player?.id === user.id })
  const otherCharacters = data.characters.filter((char) => { return char.accepted && char.player?.id !== user.id })
  otherCharacters.unshift({ id: '*', name: 'Všem' })

  const getActiveCharacter = () => {
    if (myCharacters.find((char) => { return char.id === $gameStore.activeGameCharacterId })) {
      return $gameStore.activeGameCharacterId // set character from localStorage
    } else if (myCharacters[0]) {
      return myCharacters[0].id // no character in localStorage, set first character
    } else { return null } // no character
  }

  // set activeGameCharacterId
  $gameStore.activeGameCharacterId = getActiveCharacter() // set default value

  onMount(() => { // set select value on mount
    if (identitySelect) { // might not exist if no character
      $gameStore.activeGameCharacterId ? identitySelect.value = $gameStore.activeGameCharacterId : identitySelect.selectedIndex = 0
    }
    loadPosts()
  })

  async function loadPosts () {
    const { data: postData, error } = await supabase.from('posts_owner').select('id, owner, owner_name, owner_portrait, created_at, content').eq('thread', data.game).order('created_at', { ascending: false })
    if (error) { return handleError(error) }
    posts = postData
  }

  async function submitPost () {
    saving = true
    if (editing) {
      await sendPost('PATCH', { id: editing, thread: data.game, content: textareaValue, openAiThread: data.openai_thread, owner: $gameStore.activeGameCharacterId, ownerType: 'character' })
    } else {
      await sendPost('POST', { thread: data.game, content: textareaValue, openAiThread: data.openai_thread, owner: $gameStore.activeGameCharacterId, ownerType: 'character' })
    }
    textareaValue = ''
    await loadPosts()
    saving = false
    editing = false
  }

  async function deletePost (id) {
    if (!window.confirm('Opravdu smazat příspěvek?')) { return }
    const res = await fetch(`/api/post?id=${id}&thread=${data.openai_thread}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    showSuccess('Příspěvek smazán')
    await loadPosts()
  }

  async function startEdit (id, content) {
    editing = id
    textareaValue = content
    // saving is done in submitPost
  }
</script>

{#if $gameStore.activeGameCharacterId}
  <h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
  <div class='addPostWrapper'>
    <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} />
    <div class='headlineWrapper'>
      <h3 class='text'>Jako</h3>
      <h3 class='text'>Komu</h3>
    </div>
    <div class='selectWrapper'>
      <select size='4' bind:this={identitySelect} bind:value={$gameStore.activeGameCharacterId}>
        {#each myCharacters as character}
          <option value={character.id}>{character.name}</option>
        {/each}
      </select>
      <select size='4' bind:this={audienceSelect} bind:value={activeGameAudienceIds} multiple>
        {#each otherCharacters as character}
          <option value={character.id}>{character.name}</option>
        {/each}
      </select>
    </div>
  </div>
{:else}
  <center>Nemáš ve hře žádnou postavu</center>
{/if}

<Thread {posts} canDeleteAll={isGameOwner} myIdentities={myCharacters} onDelete={deletePost} onEdit={startEdit} />

<style>
  .addPostWrapper {
    width: 100%;
  }
  .headlineWrapper, .selectWrapper {
    display: flex;
    gap: 40px;
  }
    .headlineWrapper h3 {
      flex: 1;
    }
    .selectWrapper select {
      background: none;
      flex: 1;
    }
</style>
