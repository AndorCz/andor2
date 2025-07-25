<script>
  import { fly } from 'svelte/transition'
  import { onMount, onDestroy } from 'svelte'

  let { game = {}, concept = {}, isOpen = $bindable(false) } = $props()

  let panelEl = $state()
  let isFullyOpen = $state(false)

  onMount(() => { document.addEventListener('click', handleClickOutside) })
  onDestroy(() => { document.removeEventListener('click', handleClickOutside) })

  function handleClickOutside (event) {
    if (isFullyOpen && panelEl && !panelEl.contains(event.target)) { isOpen = false }
  }
</script>

{#if isOpen}
  <div class='overlay'></div>
  <aside class='panel' bind:this={panelEl} transition:fly={{ x: 300, duration: 150 }} onintroend={() => { isFullyOpen = true }} onoutroend={() => { isFullyOpen = false }}>
    <button onclick={() => { isOpen = false }} class='close'><span class='material'>close</span></button>
    <div class='lists'>
      <div>
        <h2>Inventář</h2>
        <ul>
          {#each game.inventory as item, i (i)}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
      <div>
        <h2>Schopnosti</h2>
        <ul>
          {#each concept.abilities as ab, i (i)}
            <li>{ab}</li>
          {/each}
        </ul>
      </div>
    </div>
  </aside>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    padding-right: 0px;
    justify-content: flex-end;
  }
  .panel {
    position: fixed;
    z-index: 2000;
    width: 100%;
    max-width: 300px;
    top: 0px;
    bottom: 0px;
    right: 0px;
    padding: 20px;
    background: var(--panel);
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
    overflow-y: auto;
    border-radius: 20px 0px 0px 20px;
  }
    .close {
      position: absolute;
      top: 0px;
      right: 0px;
      display: flex;
      padding: 8px;
      border-radius: 0px 0px 0px 10px;
    }

  h2 {
    margin-top: 0px;
  }

  ul {
    padding: 0px;
    margin: 0px;
  }
    li {
      list-style: none;
      margin-bottom: 5px;
      padding: 10px;
      border-radius: 5px;
      background: var(--block);
    }

  .lists {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  @media (max-width: 768px) {
    .panel {
      max-width: 100%;
      border-radius: 10px;
    }
  }
</style>
