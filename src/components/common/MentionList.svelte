<script>
  import { onMount } from 'svelte'

  export let items = []
  export let command
  let selectedIndex = 0
  let listElement

  const selectItem = (index) => {
    const item = items[index]
    if (item) { command({ id: item.name }) }
  }

  const handleKeydown = (event) => {
    console.log('event', event.key)
    switch (event.key) {
      case 'ArrowUp': selectedIndex = (selectedIndex + items.length - 1) % items.length; break
      case 'ArrowDown': selectedIndex = (selectedIndex + 1) % items.length; break
      case 'Enter': selectItem(selectedIndex); break
      case 'Escape': break // 2DO: Handle escape, close the popup
    }
  }

  onMount(() => {
    if (listElement) { listElement.focus() }
  })
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-static-element-interactions -->
<div bind:this={listElement} class='mentionList' on:keydown={handleKeydown} tabindex='0'>
  {#each items as item, index}
    <button class='plain' class:selected={index === selectedIndex} on:click={() => selectItem(index)}>{item.name}</button>
  {/each}
</div>

<style>
  .mentionList {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
    .mentionList button {
      text-align: left;
    }
      .mentionList button.selected {
        color: var(--maximum);
      }
</style>
