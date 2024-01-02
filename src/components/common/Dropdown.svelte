<script>
  import { createEventDispatcher } from 'svelte'

  export let options = []
  export let iconsOnly = false
  export let current = null
  export let defaultLabel

  let selected = null
  let isOpen = false
  const dispatch = createEventDispatcher()

  $: selected = current // Automatically update selected based on 'current' prop

  function selectOption (option) {
    dispatch('select', option)
    selected = option.value
    isOpen = false
  }

  function toggleDropdown () { isOpen = !isOpen }

  // Function to find the currently selected option for display
  function findSelectedOption () {
    return options.find(option => option.value === selected)
  }
</script>

<div class='dropdown'>
  <button class='dropdown-toggle {iconsOnly && 'material'}' on:click={toggleDropdown} aria-haspopup='true' aria-expanded={isOpen.toString()}>
    {#key selected}
      {#if findSelectedOption()}
        {findSelectedOption().icon}
      {:else}
        {defaultLabel}
      {/if}
    {/key}
  </button>
  {#if isOpen}
    <div class='options'>
      {#each options as option}
        <button on:click={() => selectOption(option)} class={iconsOnly && 'material'} class:selected={option.value === selected}>
          {option.icon}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
  }
  button {
    padding: 5px;
  }
  .options {
    position: absolute;
    z-index: 10;
  }
</style>
