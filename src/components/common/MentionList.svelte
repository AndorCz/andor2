<script>
  import { onMount, onDestroy } from 'svelte'

  const { items = [], command, onClose } = $props()

  let selectedIndex = $state(0)
  let listElement = $state()

  const selectItem = (index) => {
    const item = items[index]
    if (item) { command({ label: item.name, id: item.id, type: item.type }) }
  }

  const handleKeydown = (event) => {
    switch (event.key) {
      case 'ArrowUp': selectedIndex = (selectedIndex + items.length - 1) % items.length; event.preventDefault(); break
      case 'ArrowDown': selectedIndex = (selectedIndex + 1) % items.length; event.preventDefault(); break
      case 'Enter': selectItem(selectedIndex); event.preventDefault(); break
      case 'Escape': onClose(); event.preventDefault(); break
    }
  }

  onMount(() => { document.addEventListener('keydown', handleKeydown) })
  onDestroy(() => { document.removeEventListener('keydown', handleKeydown) })
</script>

<div bind:this={listElement} class='mentionList'>
  {#each items as item, index (index)}
    <button class='plain' class:selected={index === selectedIndex} onclick={() => selectItem(index)}>{item.name}</button>
  {/each}
</div>

<style>
  .mentionList {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 200px;
    padding: 10px;
    overflow: auto;
  }
    .mentionList:focus {
      outline: 0px;
    }
    .mentionList button {
      text-align: left;
    }
      .mentionList button:hover, .mentionList button.selected {
        color: var(--maximum);
      }
</style>
