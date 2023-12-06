<script>
  import { clone } from '@lib/utils'
  import { gameStore } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import EditableLong from '@components/misc/EditableLong.svelte'
  import Character from '@components/games/Character.svelte'
  
  export let user
  export let data = {}

  let store = gameStore(data.id, 'info') // save last used to localstorage
  let isOwner = data.profiles.id === user.id

  const characters = { playing: [], waiting: [], open: [] }
  data.characters.forEach((char) => {
    if (char.open) { // open
      characters.open.push(char)
    } else if (char.profiles) {
      if (char.accepted) { // playing
        if (isOwner || isMine(character)) {
          characters.playing.push(char)
        } else if (!character.hidden) {
          characters.playing.push(char)
        }
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
        <Character {character} {isOwner} {user} />
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <h2>Hlásí se</h2>
    <ul class='characters'>
      {#each characters.waiting as character}
        <Character {character} {isOwner} {user} />
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <h2>Volné</h2>
    <ul class='characters'>
      {#each characters.open as character}
        <Character {character} {isOwner} {user} />
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <br>
    <center>
      <a href='./character-form' class='button'>Vytvořit novou postavu</a>
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
</style>