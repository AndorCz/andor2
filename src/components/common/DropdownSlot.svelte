<script>
  import { onMount, onDestroy } from 'svelte'

  export let defaultLabel
  export let title
  export let openUp = false
  export let width = 200

  let isOpen = false
  let openerEl
  let dropdownEl
  let left = 0

  onMount(() => { document.addEventListener('click', handleClickOutside) })
  onDestroy(() => { document.removeEventListener('click', handleClickOutside) })

  function handleClickOutside (event) {
    if (openerEl && !openerEl.contains(event.target)) {
      setTimeout(() => { isOpen = false }, 10) // give time for the click event to propagate
    }
  }

  function toggleDropdown (e) {
    const rect = e.target.getBoundingClientRect()
    left = rect.left - (rect.width / 2) - width / 2
    isOpen = !isOpen
  }
</script>

<button type='button' bind:this={openerEl} on:click={toggleDropdown} class='dropdown-toggle material' aria-haspopup='true' aria-expanded={isOpen.toString()} {title}>
  {defaultLabel}
</button>
{#if isOpen}
  <div class='options' bind:this={dropdownEl} class:openUp style='left: {left}px; top: {top}px'>
    <slot />
  </div>
{/if}

<style>
  button {
    padding: 5px;
    margin: 3px;
  }
  .options {
    position: absolute;
    top: 40px;
    z-index: 10;
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .openUp {
    bottom: 40px;
  }
</style>
