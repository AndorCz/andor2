<script>
  import { showError } from '@lib/toasts'
  import { resizePortrait } from '@lib/utils'

  export let identity = { portrait: '' }
  export let onPortraitChange

  let files
  let uploading = false

  async function processPortrait () {
    if (files && files[0]) {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(files[0])
      await new Promise(resolve => { img.onload = resolve }) // wait for the image to load
      if (img.naturalWidth < 256 || img.naturalHeight < 256) {
        return showError('Obrázek je příliš malý')
      } else { // if (img.naturalWidth >= 256 || img.naturalHeight >= 256)
        const resized = resizePortrait(img, 256, 256) // returns base64 string
        img.src = resized
      }
      identity.portrait = img.src || ''
      if (onPortraitChange) { onPortraitChange(identity.portrait) }
    }
  }

  // clear preview or identity portrait
  async function clearPortrait () {
    files = null
    identity.portrait = ''
  }
</script>

<div class='flex'>
  <label>
    {#if identity.portrait}
      <img src={identity.portrait} class='portrait' alt='portrét' />
    {:else}
      <div class='portrait blank' title='Fotka bude zmenšená na 256×256 px, oříznutá zespodu'>Nahrát portrét</div>
    {/if}
    <input type='file' accept='image/*' bind:files on:change={processPortrait} disabled={uploading} />
  </label>
  <button type='reset' class='clear material-symbols-rounded clean' on:click={clearPortrait} title='smazat'>close</button>
  <input type='hidden' name='charPortrait' value={identity.portrait || ''} />
</div>

<style>
  .flex {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 300px;
  }
    .portrait {
      cursor: pointer;
      display: inline-flex;
      object-fit: cover;
      object-position: top;
      width: var(--portrait-size, 100px);
      height: var(--portrait-size, 150px);
      border: 2px solid var(--buttonBg);
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--accent);
      font-weight: bold;
      transition: background 0.2s ease-in-out, filter 0.2s ease-in-out;
    }
      .portrait:hover {
        background: var(--block);
        filter: brightness(1.2);
      }
    input[type=file] {
      display: none;
    }
    .clear {
      display: inline-block;
      cursor: pointer;
      padding: 10px;
      margin-left: 20px;
      text-align: center;
    }
      .clear:hover {
        font-size: 28px;
      }
</style>