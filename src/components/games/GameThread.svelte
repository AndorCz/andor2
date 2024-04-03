<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { clone } from '@lib/utils'
  import { sendPost } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { platform } from '@components/common/MediaQuery.svelte'
  import Thread from '@components/common/Thread.svelte'
  import Maps from '@components/games/Maps.svelte'
  import DiceBox from '@components/games/DiceBox.svelte'
  import CharacterSelect from '@components/games/CharacterSelect.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  export let data = {}
  export let gameStore
  export let isStoryteller
  export let unread = 0
  export let activeTool = 'post'

  let textareaRef
  let searchEl
  let textareaValue = $gameStore.unsent || '' // load unsent post
  let saving = false
  let editing = false
  let filterActive = false
  let page = 0
  let pages
  let searchTerms = ''
  let diceMode = 'icon'
  // let generatingPost = false

  const activeGameAudienceIds = writable()
  const posts = writable([])
  const limit = 50
  const myCharacters = data.characters.filter((char) => { return char.accepted && char.player?.id === user.id })
  let otherCharacters = []

  $: {
    otherCharacters = [
      { id: '*', name: 'Všem' },
      ...data.characters.filter((char) => char.accepted && char.id !== $gameStore?.activeGameCharacterId)
    ]
  }

  $gameStore.activeGameCharacterId = getActiveCharacterId() // set default value
  $activeGameAudienceIds = getActiveAudience()

  onMount(() => {
    if (user.id) { delete data.unread.gameThread }
    loadPosts()
    window.addEventListener('pagehide', saveUnsent)
  })

  function getActiveCharacterId () {
    if (myCharacters.find((char) => { return char.id === $gameStore.activeGameCharacterId })) {
      return $gameStore.activeGameCharacterId // set character from localStorage
    } else if (myCharacters[0]) {
      return myCharacters[0].id // no character in localStorage, set first character
    } else { return null } // no character
  }

  async function saveUnsent () {
    if (textareaRef) { $gameStore.unsent = await textareaRef.getContent() }
  }

  async function loadPosts () {
    let res
    if (searchTerms) {
      res = await fetch(`/api/post?thread=${data.game_thread}&game=${data.id}&offset=${page * limit}&limit=${limit}&search=${searchTerms}`, { method: 'GET' })
    } else {
      // filter posts based on current audience selection
      let ownersToFilter = []
      if ($activeGameAudienceIds?.length && $activeGameAudienceIds.includes('*') === false) {
        ownersToFilter = clone($activeGameAudienceIds)
        if ($gameStore.activeGameCharacterId) { ownersToFilter.push($gameStore.activeGameCharacterId) } // add my active character
        filterActive = true
      } else {
        filterActive = false
      }
      res = await fetch(`/api/post?thread=${data.game_thread}&game=${data.id}&offset=${page * limit}&limit=${limit}&owners=${encodeURIComponent(JSON.stringify(ownersToFilter))}`, { method: 'GET' })
    }
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
    $gameStore.unsent = ''
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
    document.getElementsByClassName('toolWrapper')[0].scrollIntoView({ behavior: 'smooth' })
    // saving is done in submitPost
  }

  function getActiveAudience () {
    if ($activeGameAudienceIds?.length) {
      if ($activeGameAudienceIds.includes('*')) { return ['*'] } // set all
      return $activeGameAudienceIds // set audience characters from localStorage
    } else if (otherCharacters[0]) {
      return [otherCharacters[0].id] // no audience in localStorage, set all
    } else { return ['*'] } // no character
  }

  function onAudienceSelect () {
    if ($activeGameAudienceIds.includes('*')) { $activeGameAudienceIds = ['*'] } // set all
    loadPosts() // filter posts based on audience selection
  }

  function handleSearch () {
    if (searchEl?.value) { onSearch(searchEl.value) }
  }

  function onSearch (terms) {
    searchTerms = terms
    loadPosts()
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

  $: diceMode = activeTool === 'dice' ? 'post' : (data.context_dice ? 'icon' : 'none')
</script>

<main>
  <div class='tabs tertiary tools'>
    <button on:click={() => { activeTool = 'post' }} class='tab' class:active={activeTool === 'post'}><span class='material'>chat</span>{#if editing}Upravit{:else}Psát{/if}</button>
    <button on:click={() => { activeTool = 'maps' }} class='tab' class:active={activeTool === 'maps'}><span class='material'>explore</span>Mapy</button>
    <button on:click={() => { activeTool = 'dice' }} class='tab' class:active={activeTool === 'dice'}><span class='material'>casino</span>Kostky</button>
    <button on:click={() => { activeTool = 'find' }} class='tab' class:active={activeTool === 'find'}><span class='material'>search</span>Hledat</button>
  </div>

  <div class='toolWrapper'>
    {#if activeTool === 'dice' && user.id && $gameStore.activeGameCharacterId}
      <DiceBox threadId={data.game_thread} onRoll={loadPosts} {onAudienceSelect} {myCharacters} {otherCharacters} {activeGameAudienceIds} {gameStore} />
    {:else if activeTool === 'maps'}
      <Maps {user} game={data} {isStoryteller} />
    {:else if activeTool === 'find'}
      <div class='searchBox'>
        <!-- svelte-ignore a11y-autofocus -->
        <input type='text' size='30' placeholder='vyhledat' autofocus bind:this={searchEl} on:keydown={(e) => { if (e.key === 'Enter') { handleSearch() } }} />
        <button class='material' on:click={handleSearch}>search</button>
      </div>
    {:else if activeTool === 'post' && user.id && $gameStore.activeGameCharacterId}
      <TextareaExpandable userId={user.id} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} showButton disableEmpty />
      <CharacterSelect {onAudienceSelect} {myCharacters} {otherCharacters} {activeGameAudienceIds} {gameStore} />
      <!--{#if isStoryteller}<button class='generate' on:click={generatePost} disabled={generatingPost}>Vygenerovat</button>{/if}-->
    {/if}
  </div>
</main>

{#if searchTerms}
  <h2 class='filterHeadline'>Příspěvky obsahující "{searchTerms}" <button class='material cancel' on:click={() => { searchTerms = ''; loadPosts() }}>close</button></h2>
{:else if filterActive}
  <h2 class='filterHeadline'>Příspěvky vybraných postav <button class='material cancel' on:click={() => { $activeGameAudienceIds = ['*']; loadPosts() }}>close</button></h2>
{/if}
<!--({$activeGameAudienceIds.map((id) => { return otherCharacters.find((char) => { return char.id === id }).name }).join(', ')})-->

{#if activeTool !== 'maps' && $posts?.length}
  {#key $posts}
    <Thread {posts} {user} {unread} id={data.game_thread} bind:page={page} {diceMode} {pages} onPaging={loadPosts} canDeleteAll={isStoryteller} myIdentities={myCharacters} onDelete={deletePost} onEdit={triggerEdit} iconSize={$platform === 'desktop' ? 100 : 50} contentSection={'games'} contentId={data.id} />
  {/key}
{/if}

<style>
  .searchBox {
    margin: auto;
    background: var(--panel);
    display: flex;
    width: fit-content;
    gap: 10px;
    padding: 20px;
  }

  .toolWrapper {
    width: 100%;
  }
  /*
  .generate {
    height: fit-content;
  }
  */
  .tools {
    margin-top: 20px;
    margin-bottom: 10px;
  }
    .tools button {
      display: inline-flex;
      gap: 10px;
      align-items: center;
    }
    .tools .active {
      color: var(--text);
    }
  .filterHeadline {
    margin-top: 50px;
  }
  .cancel {
    padding: 5px;
    font-size: 19px;
    margin-left: 10px;
  }
</style>
