<script>
  import { onMount } from 'svelte'
  import { Render } from '@jill64/svelte-sanitize'
  import { slide } from 'svelte/transition'
  import { getUserStore } from '@lib/stores'

  export let lastEditorial = null

  let showEditorial = false
  let userStore

  onMount(() => {
    userStore = getUserStore()
    if ($userStore.lastClosedEditorialId !== lastEditorial.id) {
      showEditorial = true
    }
  })

  function close () {
    showEditorial = false
    $userStore.lastClosedEditorialId = lastEditorial.id
  }
</script>

{#if lastEditorial && showEditorial}
  <div id='editorial' transition:slide={{ duration: 300 }}>
    <h4>Editorial</h4>
    <a href={'/work/' + lastEditorial.id}><h2>{lastEditorial.name}</h2></a>
    <section><Render html={lastEditorial.content} /></section>
    <button on:click={close} class='close' title='Skrýt'>
      <span class='material'>check</span>
    </button>
  </div>
{/if}

<style>
  #editorial {
    padding: 20px;
    text-align: justify;
    text-justify: inter-word;
    hyphens: auto;
    background-color: var(--prominent);
    position: relative;
    overflow: hidden;
  }
    #editorial h4 {
      margin-top: 0px;
      margin-bottom: 0px;
      font-size: 18px;
    }
    #editorial h2 {
      margin-top: 0px;
      margin-bottom: 10px;
      display: inline-block;
    }
    #editorial section {
      font-size: 18px;
    }
    #editorial button {
      position: absolute;
      top: 0px;
      right: 0px;
      border-radius: 0px 0px 0px 10px;
      padding: 8px 10px 5px 11px;
    }
</style>
