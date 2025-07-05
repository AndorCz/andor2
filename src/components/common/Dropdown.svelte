<script>
  import { onMount, onDestroy } from 'svelte'

  let { title, options = [], iconsOnly = false, onselect, selected = $bindable(), defaultLabel, openUp = false } = $props()

  let x = $state(20)
  let isOpen = $state(false)
  let dropdownEl = $state()

  onMount(() => { document.addEventListener('click', handleClickOutside) })
  onDestroy(() => { document.removeEventListener('click', handleClickOutside) })

  function selectOption (option) {
    onselect(option)
    selected = option.value
    isOpen = false
  }

  function handleClickOutside (event) {
    if (dropdownEl && !dropdownEl.contains(event.target)) { isOpen = false }
  }

  function toggleDropdown (e) {
    // y = e.target.offsetTop
    x = e.target.offsetLeft
    isOpen = !isOpen
  }
  function findSelectedOption () { return options.find(option => option.value === selected) }
  function getUnselectedOptions () { return options.filter(option => option.value !== selected) }
</script>

{#key selected}
  <span class='dropdown' bind:this={dropdownEl}>
    <button type='button' class='dropdown-toggle material' onclick={toggleDropdown} aria-haspopup='true' aria-expanded={isOpen.toString()} {title}>
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
    <div class='options' style={`left: ${x - 10}px;`} class:openUp class:openDown={!openUp}>
      {#each getUnselectedOptions() as option, index (index)}
        <button type='button' onclick={() => selectOption(option)} class:label={!iconsOnly} class={iconsOnly && 'material'} class:selected={option.value === selected}>
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
    .openDown {
      top: 40px;
    }
    .openUp {
      bottom: 40px;
    }
    .options button.label {
      height: 45px;
      padding: 0 20px;
    }
</style>
