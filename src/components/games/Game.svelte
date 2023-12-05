<script>
  import { writable } from 'svelte/store'
  import { gameStore } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { clone } from '@lib/utils'
  import { showSuccess, showError } from '@lib/toasts'
  import EditableLong from '@components/misc/EditableLong.svelte'
  
  export let user
  export let data = {}

  let store = gameStore(data.id, 'info') // save last used to localstorage
  let isOwner = data.profiles.id === user.id
  
  let characters = { playing: [], waiting: [], open: [] }
  data.characters.forEach((char) => {
    if (char.open) { // open
      characters.open.push(char)
    } else if (char.profiles) {
      if (char.approved && !char.hidden) { // playing
        characters.playing.push(char)
      } else { // waiting
        characters.waiting.push(char)
      }
    }
  })

  if (!isOwner && $store.activeTab === 'chars') { $store.activeTab = 'info' } // if you get logged out

  async function updateGame () {
    const clean = clone(data)
    delete clean.profiles
    const { error } = await supabase.from('games').update(clean).eq('id', data.id)
    if (error) { handleError(error) }
    else { showSuccess('Uloženo') }
  }

  async function acceptCharacter (id) { console.log('accept id', id) }
  async function rejectCharacter (id) { console.log('reject id', id) }
</script>

<h1>{data.name}</h1>

<nav class='tabs secondary'>
  <button on:click={() => { $store.activeTab = 'info' }} class={$store.activeTab === 'info' ? 'active' : ''}>Info</button>
  <button on:click={() => { $store.activeTab = 'chat' }} class={$store.activeTab === 'chat' ? 'active' : ''}>Chat</button>
  <button on:click={() => { $store.activeTab = 'game' }} class={$store.activeTab === 'game' ? 'active' : ''}>Hra</button>
  {#if isOwner}<!-- only for the owner, for now -->
    <button on:click={() => { $store.activeTab = 'chars' }} class={$store.activeTab === 'chars' ? 'active' : ''}>Postavy</button>
  {/if}
</nav>

<div class='content'>
  {#if $store.activeTab === 'info'}
    <h2>Úvod</h2>
    <EditableLong bind:value={data.intro} onSave={updateGame} canEdit={isOwner} />
    <h2>Pro hráče</h2>
    <EditableLong bind:value={data.info} onSave={updateGame} canEdit={isOwner} />
    Vlastník: {data.profiles.name}
  {:else if $store.activeTab === 'chat'}
    <h2>Veřejná diskuze</h2>
    Tady bude mimoherní a náborová diskuze
  {:else if $store.activeTab === 'game'}
    Herní příspěvky
  {:else if $store.activeTab === 'chars'}
    <h2>Ve hře</h2>
    <ul class='characters'>
      {#each characters.playing as character}
        <li class='char'><img src={character.portrait} class='portrait' alt='portrét postavy'>{character.name}</li>
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <h2>Hlásí se</h2>
    <ul class='characters'>
      {#each characters.waiting as character}
        <li class='char'>
          <img src={character.portrait} class='portrait' alt='portrét postavy'>
          <div class='name'>
            {#if isOwner || character.profiles.id === user.id}
              <a href='./{data.id}/character-form?id={character.id}'>{character.name}</a>
            {:else}
              {character.name}
            {/if}
          </div>
          {#if isOwner}
            <div class='player'>Hráč: {character.profiles.name}</div>
            <button on:click={() => acceptCharacter(character.id)}>přijmout</button>
            <button on:click={() => rejectCharacter(character.id)}>odmítnout</button>
          {/if}
        </li>
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <h2>Volné</h2>
    <ul class='characters'>
      {#each characters.open as character}
        <li class='char'><img src={character.portrait} class='portrait' alt='portrét postavy'>{character.name}</li>
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <br>
    <center>
      <a href='./{data.id}/character-form' class='button'>Vytvořit novou postavu</a>
    </center>
  {/if}
</div>

<style>
  .content {
    padding: 40px;
  }
  .characters {
    padding: 0px;
  }
    .characters li {
      margin-left: 40px;
    }
    .characters .char {
      list-style: none;
      display: flex;
      align-items: center;
      background-color: var(--block);
      margin-left: 0px;
      margin-bottom: 2px;
      padding: 10px;
    }
    .portrait {
      width: 60px;
      margin-right: 20px;
    }
    .name {
      flex: 1;
    }
      .name a {
        font-size: 16pt;
      }
    .player {
      margin-right: 20px;
      font-style: italic;
    }
    .characters button {
      margin: 5px;
    }
</style>