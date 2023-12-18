<script>
  import { onMount } from 'svelte'
  import { getGameStore } from '@lib/stores'
  import TextareaExpandable from '@components/misc/TextareaExpandable.svelte'

  export let data = {}
  export let posts = []

  let textareaValue = ''
  let identitySelect
  let saving = false

  const gameStore = getGameStore(data.id)

  onMount(() => {
    if ($gameStore.activeGameCharacter) { identitySelect.value = $gameStore.activeGameCharacter }
  })

  async function submitPost () {
    const res = await fetch('/api/game/addPost', {
      method: 'POST',
      body: JSON.stringify({ game: data.id }), // 2DO: implement api
      headers: { 'Content-Type': 'application/json' }
    })
    res.json().then((res) => {
      if (res.error) { return showError(res.error) }
      // 2DO: reload posts
    })
  }

  function onSelect (e) { $gameStore.activeGameCharacter = e.target.value }
</script>

<h2>Herní příspěvky</h2>

<div class='headlines'>
  <h3 class='text'>Přidat příspěvek</h3>
  <h3 class='sender'>Postava</h3>
</div>
<div class='addPostWrapper'>
  <TextareaExpandable bind:value={textareaValue} disabled={saving} onSave={submitPost} />
  <div class='senderWrapper'>
    <select size='4' bind:this={identitySelect} on:change={onSelect}>
      {#each data.characters.myPlaying as character}
        <option>{character.name}</option>
      {/each}
    </select>
  </div>
</div>

<center>
  {#each posts as post}
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
      background-color: var(--block);
    }
      .content {
        padding: 20px;
      }
      .header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        background-color: var(--prominent);
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