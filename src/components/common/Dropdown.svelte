<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'

  export let options = []
  export let iconsOnly = false
  export let current = null
  export let defaultLabel
  export let title

  let selected = null
  let isOpen = false
  let dropdownEl
  const dispatch = createEventDispatcher()

  $: selected = current // Automatically update selected based on 'current' prop

  onMount(() => { document.addEventListener('click', handleClickOutside) })
  onDestroy(() => { document.removeEventListener('click', handleClickOutside) })

  function selectOption (option) {
    dispatch('select', option)
    selected = option.value
    isOpen = false
  }

  function handleClickOutside (event) {
    if (dropdownEl && !dropdownEl.contains(event.target)) { isOpen = false }
  }

  function toggleDropdown () { isOpen = !isOpen }
  function findSelectedOption () { return options.find(option => option.value === selected) }
  function getUnselectedOptions () { return options.filter(option => option.value !== selected) }
</script>

<span class='dropdown' bind:this={dropdownEl}>
  <button type='button' class='dropdown-toggle {iconsOnly && 'material'}' on:click={toggleDropdown} aria-haspopup='true' aria-expanded={isOpen.toString()} {title}>
    {#key selected}
      {#if findSelectedOption()}
        {#if iconsOnly}
          {findSelectedOption().icon}
        {:else}
          {findSelectedOption().label}
        {/if}
      {:else}
        {defaultLabel}
      {/if}
    {/key}
  </button>
  {#if isOpen}
    <div class='options'>
      {#each getUnselectedOptions() as option}
        <button type='button' on:click={() => selectOption(option)} class={iconsOnly && 'material'} class:selected={option.value === selected}>
          {#if iconsOnly}
            {option.icon}
          {:else}
            {option.label}
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</span>

<style>
  .dropdown {
    position: relative;
  }
  button {
    padding: 5px;
  }
  .options {
    position: absolute;
    left: -12px;
    z-index: 10;
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>
