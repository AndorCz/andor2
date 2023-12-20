<script>
  import { onMount } from 'svelte'
  import { getGameStore } from '@lib/stores'
  import { showError } from '@lib/toasts'
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
  // console.log('constructor', $gameStore.activeGameCharacterId)
  
  onMount (() => { // set select value on mount
    if (identitySelect) { // might not exist if no character
      $gameStore.activeGameCharacterId ? identitySelect.value = $gameStore.activeGameCharacterId : identitySelect.selectedIndex = 0
    }
    // console.log('onMount $gameStore.activeGameCharacterId', $gameStore.activeGameCharacterId)
  })

  function getCharacterName (id) {
    return data.characters.myPlaying.find((char) => { return char.id === id }).name
  }

  async function submitPost () {
    const res = await fetch('/api/game/addPost', {
      method: 'POST',
      body: JSON.stringify({ game: data.game, content: textareaValue, openAiThread: data.openai_thread, character: $gameStore.activeGameCharacterId }),
      headers: { 'Content-Type': 'application/json' }
    })
    res.json().then((res) => {
      if (res.error) { return showError(res.error) }
      textareaValue = ''
      location.reload()
    })
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

<Thread posts={data.thread} canDeleteAll={isGameOwner} myIdentities={data.characters.myPlaying} />

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