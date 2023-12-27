<script>
  import { onMount } from 'svelte'
  import { clone } from '@lib/utils'
  import { sendPost } from '@lib/helpers'
  import { getGameStore } from '@lib/stores'
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
  let filterActive = false
  // let generatingPost = false

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

  const getActiveAudience = () => {
    if ($gameStore.activeGameAudienceIds?.length) {
      if ($gameStore.activeGameAudienceIds.includes('*')) { return ['*'] } // set all
      return $gameStore.activeGameAudienceIds // set audience characters from localStorage
    } else if (otherCharacters[0]) {
      return [otherCharacters[0].id] // no audience in localStorage, set all
    } else { return [] } // no character
  }

  // prepare gameStore
  const gameStore = getGameStore(data.id)
  $gameStore.activeGameCharacterId = getActiveCharacter() // set default value
  $gameStore.activeGameAudienceIds = getActiveAudience()

  onMount(() => { // set select value on mount
    if (identitySelect) { // might not exist if no character
      $gameStore.activeGameCharacterId ? identitySelect.value = $gameStore.activeGameCharacterId : identitySelect.selectedIndex = 0
    }
    loadPosts()
  })

  async function loadPosts () {
    // filter posts based on current audience selection
    let ownersToFilter = []
    if ($gameStore.activeGameAudienceIds?.length && $gameStore.activeGameAudienceIds.includes('*') === false) {
      ownersToFilter = clone($gameStore.activeGameAudienceIds)
      if ($gameStore.activeGameCharacterId) { ownersToFilter.push($gameStore.activeGameCharacterId) } // add my active character
      filterActive = true
    } else {
      filterActive = false
    }
    const res = await fetch(`/api/post?game=${data.game}&owners=${JSON.stringify(ownersToFilter)}&audience=${JSON.stringify(myCharacters.map(char => char.id))}`, { method: 'GET' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    posts = json
  }

  async function submitPost () {
    saving = true
    const audience = $gameStore.activeGameAudienceIds.includes('*') ? null : $gameStore.activeGameAudienceIds // clean '*' from audience
    if (editing) {
      await sendPost('PATCH', { id: editing, thread: data.game, content: textareaValue, openAiThread: data.openai_thread, owner: $gameStore.activeGameCharacterId, ownerType: 'character', audience })
    } else {
      await sendPost('POST', { thread: data.game, content: textareaValue, openAiThread: data.openai_thread, owner: $gameStore.activeGameCharacterId, ownerType: 'character', audience })
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

  function onAudienceSelect () {
    if ($gameStore.activeGameAudienceIds.includes('*')) { $gameStore.activeGameAudienceIds = ['*'] } // set all
    loadPosts() // filter posts based on audience selection
  }

  /* waiting for option to delete posts in openai api
  async function generatePost () {
    if (textareaValue) { if (!window.confirm('Opravdu přepsat obsah pole?')) { return } }
    generatingPost = true
    const res = fetch('/api/game/generatePost', { method: 'POST', body: JSON.stringify({ game: data.id, intro: data.intro, owner: data.owner.id, system: data.system, thread: data.openai_thread }) })
    if (res.error) { return showError(res.error) }
    const json = await res.json()
    textareaValue = json.post
    generatingPost = false
  }
  */
</script>

{#if $gameStore.activeGameCharacterId}
  <div class='headlineWrapper'>
    <h3 class='text'>{#if editing}Upravit příspěvek{:else}Přidat příspěvek{/if}</h3>
    <!--
    {#if isGameOwner}
      <button class='generate' on:click={generatePost} disabled={generatingPost}>Vygenerovat</button>
    {/if}
    -->
  </div>
  <div class='addPostWrapper'>
    <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton />
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
      <select size='4' bind:this={audienceSelect} bind:value={$gameStore.activeGameAudienceIds} on:change={onAudienceSelect} multiple>
        {#each otherCharacters as character}
          <option value={character.id}>{character.name}</option>
        {/each}
      </select>
    </div>
  </div>
{:else}
  <center>Nemáš ve hře žádnou postavu</center>
{/if}

{#if filterActive}
  <h2 class='filterHeadline'>Příspěvky vybraných postav <button class='material-symbols cancel' on:click={() => { $gameStore.activeGameAudienceIds = ['*']; loadPosts() }}>close</button></h2>
{/if}
<!--({$gameStore.activeGameAudienceIds.map((id) => { return otherCharacters.find((char) => { return char.id === id }).name }).join(', ')})-->

<Thread {posts} canDeleteAll={isGameOwner} myIdentities={myCharacters} onDelete={deletePost} onEdit={startEdit} />

<style>
  .addPostWrapper {
    width: 100%;
  }
  /*
  .generate {
    height: fit-content;
  }
  */
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
  .filterHeadline {
    margin-top: 50px;
  }
  .cancel {
    padding: 5px;
    font-size: 14pt;
    margin-left: 10px;
  }
</style>
