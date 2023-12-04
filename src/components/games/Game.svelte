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
    <h2>Volné postavy</h2>
    <ul>
      {#each data.characters as character}
        <li><img src={character.portrait} class='portrait' alt='portrét postavy'>{character.name}</li>
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <br>
    <a href='./{data.id}/character-form' class='button'>Vytvořit novou postavu</a>
  {/if}
</div>

<style>
  .content {
    padding: 40px;
  }
  .portrait {
    width: 100px;
  }
</style>