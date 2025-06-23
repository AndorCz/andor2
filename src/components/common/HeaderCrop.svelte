<script>
  import Cropper from 'svelte-easy-crop'
  import { tooltip } from '@lib/tooltip'
  import { headerCrop } from '@lib/stores'
  import { cropImageToBlob } from '@lib/utils'

  let cropping = false
  let cropModalEl = $state()
  let cropCoords = $state()
  const aspect = 1100 / 226

  async function applyCrop () {
    const croppedImageBlob = await cropImageToBlob($headerCrop.image, cropCoords, { width: 1100, height: 226 })
    const file = new File([croppedImageBlob], $headerCrop.file.name, { type: $headerCrop.file.type }) // blob to file
    window.dispatchEvent(new CustomEvent('headerCropped', { detail: file }))
    endCrop()
  }

  // close crop modal with escape
  async function handleKeyDown (event) {
    if (event.key === 'Escape' && cropping) { endCrop() }
  }

  function endCrop () {
    cropping = false
    $headerCrop = {}
    window.dispatchEvent(new CustomEvent('headerCropEnd'))
  }
</script>

{#if $headerCrop.url && $headerCrop.image && $headerCrop.file}
  <div id='veil'></div>
  <div id='cropModal' bind:this={cropModalEl}>
    <Cropper image={$headerCrop.url} {aspect} crop={{ x: 0, y: 0 }} zoom={1} on:cropcomplete={e => { cropCoords = e.detail }} showGrid={false} />
    <button onclick={endCrop} class='cancel' title='Zrušit' use:tooltip>
      <span class='material'>close</span>
    </button>
    <button onclick={applyCrop} class='save' title='Uložit' use:tooltip>
      <span class='material'>check</span>
    </button>
  </div>
{/if}

<svelte:window onkeydown={handleKeyDown} />

<style>
  #veil {
    position: fixed;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    background-color: #000;
    opacity: 0.5;
    z-index: 999;
  }
  #cropModal {
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    bottom: 20px;
    max-height: 100svh;
    background-color: var(--panel);
    border-radius: 10px;
    z-index: 1000;
    box-shadow: 0px 0px 20px #0005;
  }
    #cropModal button {
      position: absolute;
      right: 0px;
      padding: 10px 15px;
    }
      #cropModal .save {
        bottom: 0px;
        border-radius: 10px 0px 10px 0px;
        border-bottom: 3px var(--buttonBg) solid;
      }
      #cropModal .cancel {
        top: 0px;
        border-radius: 0px 10px 0px 10px;
      }
</style>
