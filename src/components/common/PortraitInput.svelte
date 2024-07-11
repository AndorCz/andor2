<script>
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import { resizePortrait, getHash, getBase64 } from '@lib/utils'
  import { showError } from '@lib/toasts'
  import { tooltip } from '@lib/tooltip'

  export let table
  export let identity = { portrait: null }
  export let onPortraitChange = null
  export let newPortraitBase64 = null

  export let displayWidth = 140
  export let displayHeight = 140
  export let minWidth = 100
  export let saveWidth = 140
  export let saveMinHeight = 100
  export let showDelete = true

  let files
  let fileInputEl
  let uploading = false
  const maxHeight = 1000

  async function processPortrait () {
    if (files && files[0]) {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(files[0])
      await new Promise(resolve => { img.onload = resolve }) // wait for the image to load

      let file
      let saveHeight
      if (img.naturalWidth > saveWidth) {
        const imgRatio = img.naturalWidth / img.naturalHeight
        saveHeight = saveWidth / imgRatio
      } else {
        saveHeight = img.naturalHeight
      }

      if (img.naturalWidth > img.naturalHeight) {
        return showError('Výška nesmí být nižší než šířka')
      } else if (img.naturalWidth < minWidth || saveHeight < saveMinHeight) {
        return showError(`Obrázek je příliš malý, minimální rozměry jsou ${minWidth}×${saveMinHeight} pixelů`)
      } else if (saveHeight > 600) {
        return showError(`Obrázek je příliš vysoký, limit je ${maxHeight}px`)
      }

      if (img.naturalWidth > saveWidth) { // resize if too big
        displayHeight = saveHeight * (displayWidth / saveWidth)
        const resized = await resizePortrait(img, saveWidth, saveHeight, 'image/jpeg')
        file = new File([resized.blob], files[0].name, { type: 'image/jpeg' }) // blob to file
        newPortraitBase64 = resized.base64 // for form submission (only way to pass modified file to the server with formdata)
      } else {
        file = files[0]
        newPortraitBase64 = await getBase64(file)
      }

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
  <label title='Nahrát portrét' use:tooltip>
    {#if newPortraitBase64}
      <img src={newPortraitBase64} class='portrait' alt='portrét' />
    {:else if identity.portrait}
      <img src={getPortraitUrl(identity.id, identity.portrait)} class='portrait' alt='portrét' />
    {:else}
      <div class='portrait blank' title={`Obrázek bude zmenšený na šířku ${saveWidth} px`}>Nahrát<br>portrét</div>
    {/if}
    <input type='file' accept='image/*' bind:this={fileInputEl} bind:files on:change={processPortrait} disabled={uploading} />
  </label>
  {#if identity.portrait && showDelete}
    <button class='clear material clean' on:click={clearPortrait} title='Smazat' use:tooltip>delete</button>
  {/if}
  <input type='hidden' name='newPortrait' bind:value={newPortraitBase64} />
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
