<script>
  import { onMount } from 'svelte'
  import { sendPost } from '@lib/database-browser'
  import { clone, addURLParam } from '@lib/utils'
  import { showSuccess, showError } from '@lib/toasts'
  import { platform } from '@components/common/MediaQuery.svelte'
  import Thread from '@components/common/Thread.svelte'
  import Maps from '@components/games/maps/Maps.svelte'
  import DiceBox from '@components/games/DiceBox.svelte'
  import CharacterSelect from '@components/games/characters/CharacterSelect.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  const { user = {}, game = {}, gameStore, isStoryteller, isPlayer, unread = 0 } = $props()

  let activeTool = $state('post')
  let textareaRef = $state()
  let searchEl = $state()
  let saving = $state(false)
  let editing = $state(false)
  let filterActive = $state(false)
  let posts = $state([])
  let page = $state(0)
  let pages = $state()
  let loading = $state(true)
  let searchTerms = $state('')
  let diceMode = $state('icon')
  let textareaValue = $state($gameStore.unsent || '') // load unsent post
  let activeAudienceIds = $state([])
  let otherCharacters = $state([])
  let mentionList = $state([])

  const limit = unread > 50 ? Math.min(unread, 500) : 50
  const myCharacters = game.characters.filter((char) => { return char.accepted && char.player?.id === user.id && char.state === 'alive' })

  onMount(() => {
    if (user.id) { delete game.unread.gameThread }
    activeAudienceIds = getActiveAudience() // set audience from localStorage or default
    game.characters.sort((a, b) => a.name.localeCompare(b.name)) // sort characters by name
    mentionList = game.characters.filter((char) => { return char.accepted && char.state === 'alive' }).map((char) => { return { name: char.name, id: char.id, type: 'character' } })
    $gameStore.activeCharacterId = getActiveCharacterId() // set default value
    activeTool = new URLSearchParams(window.location.search).get('tool') || 'post'
    diceMode = activeTool === 'dice' ? 'post' : (game.context_dice ? 'icon' : 'none')
    otherCharacters = [
      { id: '*', name: 'Všem' },
      ...game.characters.filter((char) => char.accepted && char.state === 'alive')
    ]
    loadPosts()
  })

  function changeTool (tool) {
    activeTool = tool
    diceMode = activeTool === 'dice' ? 'post' : (game.context_dice ? 'icon' : 'none')
    addURLParam('tool', tool)
  }

  function getActiveCharacterId () {
    if (myCharacters.find((char) => { return char.id === $gameStore.activeCharacterId })) {
      return $gameStore.activeCharacterId // set character from localStorage
    } else if (myCharacters[0]) {
      return myCharacters[0].id // no character in localStorage, set first character
    } else { return null } // no character
  }

  let timeout
  async function saveUnsent () { // debounced
    if (textareaRef) {
      clearTimeout(timeout)
      timeout = setTimeout(async () => {
        const content = await textareaRef.getContent()
        $gameStore.unsent = textareaValue = content || ''
      }, 500) // Delay in ms, adjust as needed
    }
  }

  async function loadPosts () {
    loading = true
    let res
    if (searchTerms) {
      res = await fetch(`/api/post?thread=${game.game_thread}&game=${game.id}&offset=${page * limit}&limit=${limit}&search=${searchTerms}`, { method: 'GET' })
    } else {
      // filter posts based on current audience selection
      let ownersToFilter = []
      if (activeAudienceIds?.length && activeAudienceIds.includes('*') === false) {
        ownersToFilter = clone(activeAudienceIds)
        if ($gameStore.activeCharacterId) { ownersToFilter.push($gameStore.activeCharacterId) } // add my active character
        filterActive = true
      } else {
        filterActive = false
      }
      res = await fetch(`/api/post?thread=${game.game_thread}&game=${game.id}&offset=${page * limit}&limit=${limit}&owners=${encodeURIComponent(JSON.stringify(ownersToFilter))}`, { method: 'GET' })
    }
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    posts = json.posts
    pages = Math.ceil(json.count / limit)
    loading = false
  }

  async function submitPost () {
    if (saving || textareaValue === '') { return }
    saving = true
    let response
    const audience = activeAudienceIds.includes('*') ? null : activeAudienceIds // clean '*' from audience
    if (editing) {
      response = await sendPost('PATCH', { id: editing, thread: game.game_thread, content: textareaValue, openAiThread: game.openai_thread, owner: $gameStore.activeCharacterId, ownerType: 'character', audience })
    } else {
      response = await sendPost('POST', { thread: game.game_thread, content: textareaValue, openAiThread: game.openai_thread, owner: $gameStore.activeCharacterId, ownerType: 'character', audience, postType: 'game' })
    }
    if (!response.error) {
      page = 0
      textareaValue = ''
      $gameStore.unsent = ''
      await loadPosts()
      saving = false
      editing = false
    }
  }

  async function deletePost (post) {
    if (window.confirm(post.dice ? 'Opravdu smazat hod kostkou?' : 'Opravdu smazat příspěvek?')) {
      const res = await fetch(`/api/post?id=${post.id}&thread=${game.openai_thread}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
      showSuccess('Příspěvek smazán')
      await loadPosts()
    }
  }

  async function triggerEdit (post) {
    editing = post.id
    textareaValue = post.content
    textareaRef.triggerEdit(post.id, post.content)
    document.getElementsByClassName('toolWrapper')[0].scrollIntoView({ behavior: 'smooth' })
    activeAudienceIds = post.audience || ['*']
    $gameStore.activeCharacterId = post.owner
    // saving is done in submitPost
  }

  function getActiveAudience () {
    if (activeAudienceIds?.length) {
      if (activeAudienceIds.includes('*')) { return ['*'] } // set all
      return activeAudienceIds // set audience characters from localStorage
    } else if (otherCharacters[0]) {
      return [otherCharacters[0].id] // no audience in localStorage, set all
    } else { return ['*'] } // no character
  }

  async function onAudienceSelect () {
    if (activeAudienceIds.includes('*')) { activeAudienceIds = ['*'] } // set all
    await loadPosts() // filter posts based on audience selection
  }

  async function handleSearch () {
    if (searchEl?.value) {
      searchTerms = searchEl.value
      await loadPosts()
    }
  }

  /* waiting for option to delete posts in openai api
  async function generatePost () {
    if (textareaValue) { if (!window.confirm('Opravdu přepsat obsah pole?')) { return } }
    generatingPost = true
    const res = fetch('/api/game/generatePost', { method: 'POST', body: JSON.stringify({ game: game.id, annotation: game.annotation, owner: game.owner.id, system: game.system, thread: game.openai_thread }) })
    if (res.error) { return showError(res.error) }
    const json = await res.json()
    textareaValue = json.post
    generatingPost = false
  }
  */
</script>

{#if game.open_game || isStoryteller || isPlayer}
  <main>
    <div class='tabs tertiary tools'>
      <button onclick={() => { changeTool('post') }} class='tab' class:active={activeTool === 'post'}><span class='material'>chat</span>{#if editing}Upravit{:else}Psát{/if}</button>
      <button onclick={() => { changeTool('maps') }} class='tab' class:active={activeTool === 'maps'}><span class='material'>explore</span>Mapy</button>
      <button onclick={() => { changeTool('dice') }} class='tab' class:active={activeTool === 'dice'}><span class='material'>casino</span>Kostky</button>
      <button onclick={() => { changeTool('find') }} class='tab' class:active={activeTool === 'find'}><span class='material'>search</span>Hledat</button>
    </div>

    <div class='toolWrapper'>
      {#if activeTool === 'dice' && user.id && $gameStore.activeCharacterId}
        <DiceBox {game} threadId={game.game_thread} onRoll={loadPosts} {onAudienceSelect} {myCharacters} {otherCharacters} bind:activeAudienceIds {gameStore} />
      {:else if activeTool === 'maps'}
        <Maps {user} {game} {isStoryteller} />
      {:else if activeTool === 'find'}
        <div class='searchBox'>
          <input type='text' size='30' placeholder='vyhledat' autofocus bind:this={searchEl} onkeydown={(e) => { if (e.key === 'Enter') { handleSearch() } }} />
          <button class='material' onclick={handleSearch}>search</button>
        </div>
      {:else if activeTool === 'post' && user.id && $gameStore.activeCharacterId}
        {#if game.archived}
          <p class='info'>Hra je archivovaná, není možné do ní psát.</p>
        {:else}
          <TextareaExpandable onTyping={saveUnsent} {user} allowHtml bind:this={textareaRef} bind:value={textareaValue} disabled={saving} onSave={submitPost} bind:editing={editing} fonts={game.fonts} {mentionList} showButton disableEmpty />
          <CharacterSelect {onAudienceSelect} {myCharacters} {otherCharacters} bind:activeAudienceIds {gameStore} />
          <!--{#if isStoryteller}<button class='generate' on:click={generatePost} disabled={generatingPost}>Vygenerovat</button>{/if}-->
        {/if}
      {/if}
    </div>
  </main>

  {#if searchTerms}
    <h2 class='filterHeadline'>Příspěvky obsahující "{searchTerms}" <button class='material cancel' onclick={async () => { searchTerms = ''; await loadPosts() }}>close</button></h2>
  {:else if filterActive}
    <h2 class='filterHeadline'>Příspěvky vybraných postav <button class='material cancel' onclick={async () => { activeAudienceIds = ['*']; await loadPosts() }}>close</button></h2>
  {/if}
  <!--({activeAudienceIds.map((id) => { return otherCharacters.find((char) => { return char.id === id }).name }).join(', ')})-->

  {#if activeTool !== 'maps'}
    <Thread type='game' {loading} {posts} {user} {unread} id={game.game_thread} bind:page={page} {diceMode} {pages} onPaging={loadPosts} canDeleteAll={isStoryteller} myIdentities={myCharacters} onDelete={deletePost} onEdit={triggerEdit} iconSize={$platform === 'desktop' ? 100 : 50} contentSection='games' contentId={game.id} />
  {/if}
{:else}
  <div class='info'><span class='material'>info</span>Hra je soukromá</div>
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
    padding-bottom: 10px;
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

  .info {
    margin: 60px 0px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  @media (max-width: 500px) {
    .tools {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin-top: 10px;
    }
      .tools button {
        gap: 5px;
        padding: 0px;
        font-size: 21px;
      }
        .tools .material {
          font-size: 18px;
        }
  }
</style>
