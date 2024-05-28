<script>
  import { onMount, onDestroy } from 'svelte'

  export let defaultLabel
  export let title
  export let openUp = false

  let isOpen = false
  let dropdownEl

  onMount(() => { document.addEventListener('click', handleClickOutside) })
  onDestroy(() => { document.removeEventListener('click', handleClickOutside) })

  function handleClickOutside (event) {
    if (dropdownEl && !dropdownEl.contains(event.target)) { isOpen = false }
  }

  function toggleDropdown () { isOpen = !isOpen }
</script>

<span class='dropdown' bind:this={dropdownEl} class:openUp>
  <button type='button' class='dropdown-toggle material' on:click={toggleDropdown} aria-haspopup='true' aria-expanded={isOpen.toString()} {title}>
    {defaultLabel}
  </button>
  {#if isOpen}
    <div class='options'>
      <slot />
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
    left: -50%;
    z-index: 10;
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .openUp .options {
    bottom: 40px;
  }
</style>
