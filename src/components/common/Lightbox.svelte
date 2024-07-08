<script>
  import { lightboxImage } from '@lib/stores'

  function close () { lightboxImage.set('') }

  function handleKeyDown (event) {
    if (event.key === 'Escape') { close() }
  }
</script>

{#if $lightboxImage}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class='veil' on:click={close}>
    <img src={$lightboxImage} alt='Lightbox' class='lightbox-image'>
  </div>
{/if}

<svelte:window on:keydown={handleKeyDown} />

<style>
  .veil {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    cursor: pointer;
  }

  .lightbox-image {
    max-width: 90%;
    max-height: 90%;
    margin: auto;
  }
</style>
