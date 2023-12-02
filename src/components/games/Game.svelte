<script>
  import { writable } from 'svelte/store'
  import { gameStore } from '@lib/stores'
  
  export let name
  export let data = {}

  let store = gameStore(name, 'info') // save last used to localstorage
</script>

<h1>{name}</h1>

<nav class='tabs secondary'>
  <button on:click={() => { $store.activeTab = 'info' }} class={$store.activeTab === 'info' ? 'active' : ''}>Info</button>
  <button on:click={() => { $store.activeTab = 'thread1' }} class={$store.activeTab === 'thread1' ? 'active' : ''}>Vlákno</button>
  <button on:click={() => { $store.activeTab = 'settings' }} class={$store.activeTab === 'settings' ? 'active' : ''}>Nastavení</button>
</nav>

<div class='content'>
  {#if $store.activeTab === 'info'}
    Autor: {data.profiles.name}
    <br><br>
    Popis hry
    <br><br>
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
</style>