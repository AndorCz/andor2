<script>
  import { onMount, onDestroy } from 'svelte'

  const { defaultLabel, title, openUp = false, children } = $props()

  let isOpen = $state(false)
  let openerEl = $state()
  let dropdownEl = $state()

  onMount(() => { document.addEventListener('click', handleClickOutside) })
  onDestroy(() => { document.removeEventListener('click', handleClickOutside) })

  function handleClickOutside (event) {
    if (openerEl && !openerEl.contains(event.target)) {
      setTimeout(() => { isOpen = false }, 10) // give time for the click event to propagate
    }
  }

  function toggleDropdown (e) { isOpen = !isOpen }
</script>

<button type='button' bind:this={openerEl} onclick={toggleDropdown} class='dropdown-toggle material' aria-haspopup='true' aria-expanded={isOpen.toString()} {title}>
  {defaultLabel}
</button>
{#if isOpen}
  <div class='options' class:openUp class:openDown={!openUp} bind:this={dropdownEl}>
    {@render children?.()}
  </div>
{/if}

<style>
  button {
    padding: 5px;
  }
  .options {
    position: absolute;
    left: 0px;
    width: 200px;
    z-index: 999;
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
    .openDown {
      top: 40px;
    }
    .openUp {
      bottom: 40px;
    }
</style>
