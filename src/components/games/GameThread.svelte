<script>
  import { onMount } from 'svelte'
  import { getGameStore } from '@lib/stores'
  import { showError } from '@lib/toasts'
  import { sendPost } from '@lib/database'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Thread from '@components/common/Thread.svelte'

  export let data = {}
  export let isGameOwner

  // let activeCharacter
  let textareaValue = ''
  let identitySelect
  let saving = false

  const gameStore = getGameStore(data.id)

  const getActiveCharacter = () => {
    if (data.characters.myPlaying.find((char) => { return char.id === $gameStore.activeGameCharacterId })) {
      return $gameStore.activeGameCharacterId // set character from localStorage
    } else if (data.characters.myPlaying[0]) {
      return data.characters.myPlaying[0].id // no character in localStorage, set first character
    } else { return null } // no character
  }

  // set activeGameCharacterId
  $gameStore.activeGameCharacterId = getActiveCharacter() // set default value

  onMount(() => { // set select value on mount
    if (identitySelect) { // might not exist if no character
      $gameStore.activeGameCharacterId ? identitySelect.value = $gameStore.activeGameCharacterId : identitySelect.selectedIndex = 0
    }
  })

  async function submitPost () {
    saving = true
    const res = await sendPost({ thread: data.game, content: textareaValue, openAiThread: data.openai_thread, owner: $gameStore.activeGameCharacterId, ownerType: 'character' })
    if (res) {
      textareaValue = ''
      location.reload()
    }
  }

  async function deletePost (id) {
    if (!window.confirm('Opravdu smazat příspěvek?')) { return }
    const res = await fetch('/api/post?id=' + id, { method: 'DELETE' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    window.location.href = window.location.href + '/?toastType=success&toastText=' + encodeURIComponent('Příspěvek smazán')
  }
</script>

<h2>Herní příspěvky</h2>

{#if $gameStore.activeGameCharacterId}
  <div class='headlines'>
    <h3 class='text'>Přidat příspěvek</h3>
    <h3 class='sender'>Postava</h3>
  </div>
  <div class='addPostWrapper'>
    <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} />
    <div class='senderWrapper'>
      <select size='4' bind:this={identitySelect} bind:value={$gameStore.activeGameCharacterId}>
        {#each data.characters.myPlaying as character}
          <option value={character.id}>{character.name}</option>
        {/each}
      </select>
    </div>
  </div>
{:else}
  <center>Nemáš ve hře žádnou postavu</center>
{/if}

<Thread posts={data.thread} canDeleteAll={isGameOwner} myIdentities={data.characters.myPlaying} onDelete={deletePost} />

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
