<script>
  import { showError } from '@lib/toasts'
  import { resizePortrait } from '@lib/utils'
  import { supabase, handleError, getPortrait, getHash } from '@lib/database'

  export let table
  export let identity = { portrait: null }
  export let onPortraitChange = null

  export let displayWidth = 140
  export let displayHeight = 140
  export let saveWidth = 140
  export let saveMinHeight = 140

  let files
  let fileInputEl
  let resizedPortraitBase64
  let uploading = false
  const maxHeight = 600

  async function processPortrait () {
    if (files && files[0]) {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(files[0])
      await new Promise(resolve => { img.onload = resolve }) // wait for the image to load

      // calculate new height
      const imgRatio = img.naturalWidth / img.naturalHeight
      const saveHeight = saveWidth / imgRatio

      if (img.naturalWidth < saveWidth || saveHeight < saveMinHeight) {
        return showError(`Obrázek je příliš malý, minimální rozměry jsou ${saveWidth}x${saveMinHeight}px a výška nesmí být nižší než šířka`)
      } else if (saveHeight > 600) {
        return showError(`Obrázek je příliš vysoký, limit je ${maxHeight}px`)
      }

      displayHeight = saveHeight * (displayWidth / saveWidth)
      const resized = await resizePortrait(img, saveWidth, saveHeight, 'image/jpeg')
      const file = new File([resized.blob], files[0].name, { type: 'image/jpeg' }) // blob to file

      resizedPortraitBase64 = resized.base64 // for form submission (only way to pass modified file to the server with formdata)
      if (onPortraitChange) { // for immediate upload
        uploading = true
        await onPortraitChange(file)
        identity.portrait = getHash()
        uploading = false
      }

      fileInputEl.value = '' // clear input
    }
  }

  // clear preview or identity portrait
  async function clearPortrait (e) {
    e.preventDefault()
    if (window.confirm('Opravdu smazat portrét?')) {
      files = null
      identity.portrait = null
      const { error: error1 } = await supabase.storage.from('portraits').remove([identity.id + '.jpg'])
      if (error1) { return handleError(error1) }
      const { error: error2 } = await supabase.from(table).update({ portrait: null }).eq('id', identity.id)
      if (error2) { return handleError(error2) }
    }
  }
</script>

<div class='wrapper' style={`--portrait-width: ${displayWidth}px; --portrait-height: ${displayHeight}px`}>
  <label>
    {#if resizedPortraitBase64}
      <img src={resizedPortraitBase64} class='portrait' alt='portrét' />
    {:else if identity.portrait}
      {#await getPortrait(identity.id, identity.portrait) then url}<img src={url} class='portrait' alt='portrét' />{/await}
    {:else}
      <div class='portrait blank' title={`Obrázek bude zmenšený na šířku ${saveWidth} px`}>Nahrát<br>portrét</div>
    {/if}
    <input type='file' accept='image/*' bind:this={fileInputEl} bind:files on:change={processPortrait} disabled={uploading} />
  </label>
  {#if identity.portrait}
    <button class='clear material clean' on:click={clearPortrait} title='smazat'>close</button>
  {/if}
  <input type='hidden' name='charPortrait' bind:value={resizedPortraitBase64} />
</div>

<style>
  .wrapper {
    position: relative;
    width: var(--portrait-width, 140px);
    min-height: var(--portrait-height, 200px);
  }
    .portrait {
      cursor: pointer;
      display: flex;
      object-fit: cover;
      object-position: center 20%;
      width: var(--portrait-width, 140px);
      min-height: var(--portrait-height, 200px);
      border: 2px solid var(--buttonBg);
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--link);
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
