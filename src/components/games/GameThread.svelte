<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { clone } from '@lib/utils'
  import { posts, getGameStore } from '@lib/stores'
  import { sendPost } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { platform } from '@components/common/MediaQuery.svelte'
  import Thread from '@components/common/Thread.svelte'
  import DiceBox from '@components/games/DiceBox.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  export let data = {}
  export let isGameOwner
  export let unread = 0

  let textareaRef
  let textareaValue = ''
  let identitySelect
  let audienceSelect
  let saving = false
  let editing = false
  let filterActive = false
  let showDiceBox = false
  let page = 0
  let pages
  // let generatingPost = false

  const activeGameAudienceIds = writable()

  const limit = 50
  const myCharacters = data.characters.filter((char) => { return char.accepted && char.player?.id === user.id })
  let otherCharacters = []
  $: {
    otherCharacters = [
      { id: '*', name: 'Všem' },
      ...data.characters.filter((char) => char.accepted && char.id !== $gameStore?.activeGameCharacterId)
    ]
  }

  function getActiveCharacterId () {
    if (myCharacters.find((char) => { return char.id === $gameStore.activeGameCharacterId })) {
      return $gameStore.activeGameCharacterId // set character from localStorage
    } else if (myCharacters[0]) {
      return myCharacters[0].id // no character in localStorage, set first character
    } else { return null } // no character
  }

  function getActiveAudience () {
    if ($activeGameAudienceIds?.length) {
      if ($activeGameAudienceIds.includes('*')) { return ['*'] } // set all
      return $activeGameAudienceIds // set audience characters from localStorage
    } else if (otherCharacters[0]) {
      return [otherCharacters[0].id] // no audience in localStorage, set all
    } else { return [] } // no character
  }

  // prepare gameStore
  const gameStore = getGameStore(data.id)
  $gameStore.activeGameCharacterId = getActiveCharacterId() // set default value
  $activeGameAudienceIds = getActiveAudience()

  onMount(() => { // set select value on mount
    if (user.id) {
      delete data.unread.gameThread
      if (identitySelect) { // might not exist if no character
        $gameStore.activeGameCharacterId ? identitySelect.value = $gameStore.activeGameCharacterId : identitySelect.selectedIndex = 0
      }
      if (audienceSelect) { audienceSelect.selectedIndex = 0 }
    }
    loadPosts()
  })

  async function loadPosts () {
    // filter posts based on current audience selection
    let ownersToFilter = []
    if ($activeGameAudienceIds?.length && $activeGameAudienceIds.includes('*') === false) {
      ownersToFilter = clone($activeGameAudienceIds)
      if ($gameStore.activeGameCharacterId) { ownersToFilter.push($gameStore.activeGameCharacterId) } // add my active character
      filterActive = true
    } else {
      filterActive = false
    }
    const res = await fetch(`/api/post?thread=${data.game_thread}&game=${data.id}&offset=${page * limit}&limit=${limit}&owners=${encodeURIComponent(JSON.stringify(ownersToFilter))}`, { method: 'GET' })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    $posts = json.posts
    pages = Math.ceil(json.count / limit)
  }

  async function submitPost () {
    if (saving || textareaValue === '') { return }
    saving = true
    const audience = $activeGameAudienceIds.includes('*') ? null : $activeGameAudienceIds // clean '*' from audience
    if (editing) {
      await sendPost('PATCH', { id: editing, thread: data.game_thread, content: textareaValue, openAiThread: data.openai_thread, owner: $gameStore.activeGameCharacterId, ownerType: 'character', audience })
    } else {
      await sendPost('POST', { thread: data.game_thread, content: textareaValue, openAiThread: data.openai_thread, owner: $gameStore.activeGameCharacterId, ownerType: 'character', audience })
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

  async function triggerEdit (id, content) {
    editing = id
    textareaValue = content
    textareaRef.triggerEdit(id, content)
    document.getElementsByClassName('addPostWrapper')[0].scrollIntoView({ behavior: 'smooth' })
    // saving is done in submitPost
  }

  function onAudienceSelect () {
    if ($activeGameAudienceIds.includes('*')) { $activeGameAudienceIds = ['*'] } // set all
    loadPosts() // filter posts based on audience selection
  }

  /* waiting for option to delete posts in openai api
  async function generatePost () {
    if (textareaValue) { if (!window.confirm('Opravdu přepsat obsah pole?')) { return } }
    generatingPost = true
    const res = fetch('/api/game/generatePost', { method: 'POST', body: JSON.stringify({ game: data.id, annotation: data.annotation, owner: data.owner.id, system: data.system, thread: data.openai_thread }) })
    if (res.error) { return showError(res.error) }
    const json = await res.json()
    textareaValue = json.post
    generatingPost = false
  }
  */
</script>

{#if $gameStore.activeGameCharacterId}
  <div class='toggleWrapper tabs tertiary'>
    {#if showDiceBox}
      <button on:click={() => { showDiceBox = false }} class='diceToggle tab'>Psát příspěvek</button>
      <h3>Házet kostky</h3>
    {:else}
      <h3>{#if editing}Upravit příspěvek{:else}Psát příspěvek{/if}</h3>
      <button on:click={() => { showDiceBox = true }} class='diceToggle tab'>Házet kostky</button>
    {/if}
    <!--
    {#if isGameOwner}
      <button class='generate' on:click={generatePost} disabled={generatingPost}>Vygenerovat</button>
    {/if}
    -->
  </div>
  <div class='addPostWrapper'>
    {#if showDiceBox}
      <DiceBox threadId={data.game_thread} gameId={data.id} onRoll={loadPosts} />
    {:else}
      <TextareaExpandable userId={user.id} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton disableEmpty />
    {/if}
    <div class='headlineWrapper'>
      <h3>Jako</h3>
      <h3>Komu</h3>
    </div>
    <div class='selectWrapper'>
      <select size='4' bind:this={identitySelect} bind:value={$gameStore.activeGameCharacterId}>
        {#each myCharacters as character}
          <option value={character.id} class='character'>{character.name}</option>
        {/each}
      </select>
      <select size='4' bind:this={audienceSelect} bind:value={$activeGameAudienceIds} on:change={onAudienceSelect} multiple>
        {#each otherCharacters as character}
          <option value={character.id} class='character'>{character.name}</option>
        {/each}
      </select>
    </div>
  </div>
{:else}
  <center>Nemáš ve hře žádnou postavu</center>
{/if}

{#if filterActive}
  <h2 class='filterHeadline'>Příspěvky vybraných postav <button class='material cancel' on:click={() => { $activeGameAudienceIds = ['*']; loadPosts() }}>close</button></h2>
{/if}
<!--({$activeGameAudienceIds.map((id) => { return otherCharacters.find((char) => { return char.id === id }).name }).join(', ')})-->

{#key $posts}
  <Thread {posts} {user} {unread} id={data.game_thread} bind:page={page} {pages} onPaging={loadPosts} canDeleteAll={isGameOwner} myIdentities={myCharacters} onDelete={deletePost} onEdit={triggerEdit} iconSize={$platform === 'desktop' ? 100 : 50} />
{/key}

<style>
  .addPostWrapper {
    width: 100%;
  }
  /*
  .generate {
    height: fit-content;
  }
  */
  .toggleWrapper {
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
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
    .diceToggle {
      padding: 15px;
    }
  .filterHeadline {
    margin-top: 50px;
  }
  .cancel {
    padding: 5px;
    font-size: 19px;
    margin-left: 10px;
  }

  @media (max-width: 860px) {
    .headlineWrapper, .selectWrapper {
      gap: 10px;
    }
  }
</style>
