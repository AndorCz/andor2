<script>
  import { onMount } from 'svelte'
  import { getGameStore } from '@lib/stores'
  import { showError } from '@lib/toasts'
  import TextareaExpandable from '@components/misc/TextareaExpandable.svelte'

  export let data = {}

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
      // 2DO: reload posts
    })
  }

  /* function onSelect (e) { console.log('$gameStore.activeGameCharacterId', $gameStore.activeGameCharacterId) } */
</script>

<h2>Herní příspěvky</h2>

{#if $gameStore.activeGameCharacterId}
  <div class='headlines'>
    <h3 class='text'>Přidat příspěvek</h3>
    <h3 class='sender'>Postava</h3>
  </div>
  <div class='addPostWrapper'>
    <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} /> <!-- identity={this.activeCharacter} -->
    <div class='senderWrapper'>
      <select size='4' bind:this={identitySelect} bind:value={$gameStore.activeGameCharacterId}> <!-- on:change={onSelect} -->
        {#each data.characters.myPlaying as character}
          <option value={character.id}>{character.name}</option>
        {/each}
      </select>
    </div>
  </div>
{:else}
  <center>Nemáš ve hře žádnou postavu</center>
{/if}

<center>
  {#each data.thread as post}
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
        background-color: var(--block);
        opacity: 0.5;
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