<script>
  import { fly } from 'svelte/transition'
  import { onMount, onDestroy } from 'svelte'

  let { concept = {}, isOpen = $bindable(false) } = $props()

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
    <h2>Svět</h2>
    {@html concept.generated_world}
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
    z-index: 99999;
    max-width: 600px;
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

  @media (max-width: 768px) {
    .panel {
      max-width: 100%;
      border-radius: 10px;
    }
  }
</style>
