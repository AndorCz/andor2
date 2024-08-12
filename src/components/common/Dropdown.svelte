<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'

  export let options = []
  export let iconsOnly = false
  export let selected = null
  export let defaultLabel
  export let title

  let y = 20
  let x = 20
  let isOpen = false
  let dropdownEl
  const dispatch = createEventDispatcher()

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

  function toggleDropdown (e) {
    y = e.target.offsetTop
    x = e.target.offsetLeft
    isOpen = !isOpen
  }
  function findSelectedOption () { return options.find(option => option.value === selected) }
  function getUnselectedOptions () { return options.filter(option => option.value !== selected) }
</script>

{#key selected}
  <span class='dropdown' bind:this={dropdownEl}>
    <button type='button' class='dropdown-toggle material' on:click={toggleDropdown} aria-haspopup='true' aria-expanded={isOpen.toString()} {title}>
      {#if selected && findSelectedOption()}
        {#if iconsOnly}
          {findSelectedOption().icon}
        {:else}
          {@html findSelectedOption().label}
        {/if}
      {:else}
        {defaultLabel}
      {/if}
    </button>
  </span>
  {#if isOpen}
    <div class='options' style={`top: ${y + 30}px; left: ${x - 10}px;`}>
      {#each getUnselectedOptions() as option}
        <button type='button' on:click={() => selectOption(option)} class:label={!iconsOnly} class={iconsOnly && 'material'} class:selected={option.value === selected}>
          {#if iconsOnly}
            {option.icon}
          {:else}
            {@html option.label}
          {/if}
        </button>
      {/each}
    </div>
  {/if}
{/key}

<style>
  button {
    padding: 5px;
  }
  .options {
    position: absolute;
    z-index: 10;
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
    .options button.label {
      height: 45px;
      padding: 0 20px;
    }
</style>
