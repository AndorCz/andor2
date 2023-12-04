<script>
  import { writable } from 'svelte/store'
  import { gameStore } from '@lib/stores'
  import { supabase } from '@lib/database'
  import { clone } from '@lib/utils'
  import { showSuccess, showError } from '@lib/toasts'
  import EditableLong from '@components/misc/EditableLong.svelte'
  
  export let user
  export let name
  export let data = {}

  let store = gameStore(name, 'info') // save last used to localstorage
  let isAuthor = data.profiles.id === user.id

  if (!isAuthor && $store.activeTab === 'chars') { $store.activeTab = 'info' } // if you get logged out

  async function updateGame () {
    const clean = clone(data)
    delete clean.profiles
    const { error } = await supabase.from('games').update(clean).eq('id', data.id)
    if (error) ( showError('Aktualizace herních dat se nezdařila. Zkus to prosím později.') )
    else { showSuccess('Uloženo') }
  }
</script>

<h1>{name}</h1>

<nav class='tabs secondary'>
  <button on:click={() => { $store.activeTab = 'info' }} class={$store.activeTab === 'info' ? 'active' : ''}>Info</button>
  <button on:click={() => { $store.activeTab = 'chat' }} class={$store.activeTab === 'chat' ? 'active' : ''}>Chat</button>
  <button on:click={() => { $store.activeTab = 'game' }} class={$store.activeTab === 'game' ? 'active' : ''}>Hra</button>
  {#if isAuthor}<!-- only for the author, for now -->
    <button on:click={() => { $store.activeTab = 'chars' }} class={$store.activeTab === 'chars' ? 'active' : ''}>Postavy</button>
  {/if}
</nav>

<div class='content'>
  {#if $store.activeTab === 'info'}
    <h2>Úvod</h2>
    <EditableLong bind:value={data.intro} onSave={updateGame} canEdit={isAuthor} />
    <h2>Pro hráče</h2>
    <EditableLong bind:value={data.info} onSave={updateGame} canEdit={isAuthor} />
    Autor: {data.profiles.name}
  {:else if $store.activeTab === 'chat'}
    <h2>Veřejná diskuze</h2>
    Tady bude mimoherní a náborová diskuze
  {:else if $store.activeTab === 'game'}
    Herní příspěvky
  {:else if $store.activeTab === 'chars'}
    <h2>Volné postavy</h2>
    <br>
    <a href='./{name}/new-character' class='button'>Vytvořit novou postavu</a>
  {/if}
</div>

<style>
  .content {
    padding: 40px;
  }
</style>