<script>
  import { showError } from '@lib/toasts'
  import { resizePortrait } from '@lib/utils'

  export let identity = { portrait: '' }
  export let onPortraitChange = null
  export let displayWidth = 140
  export let displayHeight = 200

  const saveWidth = 140
  const saveHeight = 200

  let files
  let uploading = false

  async function processPortrait () {
    uploading = true
    if (files && files[0]) {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(files[0])
      await new Promise(resolve => { img.onload = resolve }) // wait for the image to load
      if (img.naturalWidth < saveWidth || img.naturalHeight < saveHeight) {
        return showError('Obrázek je příliš malý')
      } else {
        const resized = resizePortrait(img, saveWidth, saveHeight) // returns base64 string
        img.src = resized
      }
      identity.portrait = img.src || ''
      if (onPortraitChange) { await onPortraitChange(identity.portrait) }
    }
    uploading = false
  }

  // clear preview or identity portrait
  async function clearPortrait (e) {
    e.preventDefault()
    const confirm = window.prompt('Opravdu smazat portrét? (ano/ne)')
    if (confirm !== 'ano') { return }
    files = null
    identity.portrait = ''
  }
</script>

<div class='wrapper' style={`--portrait-width: ${displayWidth}px; --portrait-height: ${displayHeight}px`}>
  <label>
    {#if identity.portrait}
      <img src={identity.portrait} class='portrait' alt='portrét' />
    {:else}
      <div class='portrait blank' title={`Fotka bude zmenšená na ${saveWidth}×${saveHeight} px, oříznutá zespodu`}>Nahrát<br>portrét</div>
    {/if}
    <input type='file' accept='image/*' bind:files on:change={processPortrait} disabled={uploading} />
  </label>
  <button class='clear material clean' on:click={clearPortrait} title='smazat'>close</button>
  <input type='hidden' name='charPortrait' value={identity.portrait || ''} />
</div>

<style>
  .wrapper {
    position: relative;
    width: var(--portrait-width, 140px);
    height: var(--portrait-height, 200px);
  }
    .portrait {
      cursor: pointer;
      display: flex;
      object-fit: cover;
      object-position: top;
      width: var(--portrait-width, 140px);
      height: var(--portrait-height, 200px);
      border: 2px solid var(--buttonBg);
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--accent);
      font-weight: bold;
      transition: background 0.2s ease-in-out, filter 0.2s ease-in-out;
      border-radius: 10px;
    }
      .portrait:hover {
        background: var(--block);
        filter: brightness(1.2);
      }
    input[type=file] {
      display: none;
    }

    .clear {
      position: absolute;
      left: 1px;
      bottom: 1px;
      display: block;
      cursor: pointer;
      padding: 5px;
      text-align: center;
      border-radius: 0px 10px 0px 10px;
    }
      .clear:hover {
        font-size: 28px;
      }
</style>
