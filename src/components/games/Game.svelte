<script>
  import { writable } from 'svelte/store'
  import { gameStore } from '@lib/stores'
  import { supabase } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { clone } from '@lib/utils'
  
  export let user
  export let name
  export let data = {}

  let store = gameStore(name, 'info') // save last used to localstorage
  let isAuthor = data.profiles.id === user.id

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
  <button on:click={() => { $store.activeTab = 'thread1' }} class={$store.activeTab === 'thread1' ? 'active' : ''}>Vlákno</button>
  {#if isAuthor}<!-- only for the author, for now -->
    <button on:click={() => { $store.activeTab = 'settings' }} class={$store.activeTab === 'settings' ? 'active' : ''}>Nastavení</button>
  {/if}
</nav>

<div class='content'>
  {#if $store.activeTab === 'info'}
    <h3>Popis hry</h3>
    {#if isAuthor}
      Formátování markdown<br><br>
      <textarea class='gameInfo' bind:value={data.info}></textarea>
      <button class='saveGameInfo' on:click={updateGame}>Uložit</button>
    {:else}
      <p class='gameInfo'>{data.info}</p>
    {/if}
    <br><br>
    Autor: {data.profiles.name}
    <br><br>
    <h3>Veřejná diskuze</h3>
    Mimoherní a náborová diskuze
  {:else if $store.activeTab === 'thread1'}
    Příspěvky
  {:else if $store.activeTab === 'settings'}
    Postavy, vypravěči
  {/if}
</div>

<style>
  .content {
    padding: 40px;
  }
  .gameInfo {
    width: 100%;
    min-height: 100px;
  }
  p.gameInfo {
    padding: 20px;
    font-style: italic;
    background-color: var(--block);
  }
  button.saveGameInfo {
    float: right;
    clear: both;
  }
</style>