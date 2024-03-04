<script>
  import { supabase, handleError, getHash } from '@lib/database'
  import { getImage, cropImageToBlob } from '@lib/utils'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview } from '@lib/stores'
  import Cropper from 'svelte-easy-crop'

  export let data = {}
  export let section
  export let unit

  let uploading = false
  let cropping = false
  let files
  let newHeaderUrl
  let headerInputEl
  let cropModalEl
  let newHeaderEl
  let cropCoords
  const aspect = 1100 / 226

  async function processImage () {
    if (files && files[0]) {
      const file = files[0]
      newHeaderEl = await getImage(file)
      if (newHeaderEl.width < 1100) { return showError(`Obrázek má malou šířku (${newHeaderEl.width}px), je třeba alespoň 1100px`) }
      if (newHeaderEl.width < 226) { return showError(`Obrázek má malou výšku (${newHeaderEl.height}px), je třeba alespoň 226px`) }
      // if (newHeaderEl.width >= 1100 && newHeaderEl.width < 2000 && newHeaderEl.height === 226) { // Correct size
      // uploadHeader(file) // can't use, need to convert to jpg
      cropping = true
      newHeaderUrl = URL.createObjectURL(file)
    }
  }

  async function uploadHeader (file) {
    uploading = true
    const { error: error1 } = await supabase.storage.from('headers').upload(unit + '-' + data.id + '.jpg', file, { upsert: true })
    if (error1) { return handleError(error1) }
    const { error: error2 } = await supabase.from(section).update({ custom_header: getHash() }).eq('id', data.id)
    if (error2) { return handleError(error2) }
    data.custom_header = getHash()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička byla uložena')
    uploading = false
    $headerPreview = URL.createObjectURL(file)
    // await fetch('/api/cache?type=' + section, { method: 'GET' }) // clear cache
  }

  async function clearHeader () { // clear in db
    if (data.custom_header) {
      const { error: error1 } = await supabase.storage.from('headers').remove([unit + '-' + data.id + '.jpg'])
      if (error1) { return handleError(error1) }
      const { error: error2 } = await supabase.from(section).update({ custom_header: null }).eq('id', data.id)
      if (error2) { return handleError(error2) }
    }
    data.custom_header = null
    files = null
    $headerPreview = '/header.jpg'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička smazána')
    // await fetch('/api/cache?type=' + section, { method: 'GET' }) // clear cache
  }

  // Cropping

  async function applyCrop () {
    const croppedImageBlob = await cropImageToBlob(newHeaderEl, cropCoords, { width: 1100, height: 226 })
    const file = new File([croppedImageBlob], files[0].name, { type: files[0].type }) // blob to file
    uploadHeader(file)
    endCrop()
  }

  // close crop modal with escape
  async function handleKeyDown (event) {
    if (event.key === 'Escape' && cropping) { endCrop() }
  }

  function endCrop () {
    cropping = false
    files = null
    headerInputEl.value = ''
  }
</script>

{#if cropping}
  <div id='veil'></div>
  <div id='cropModal' bind:this={cropModalEl}>
    <Cropper image={newHeaderUrl} {aspect} crop={{ x: 0, y: 0 }} zoom={1} on:cropcomplete={e => { cropCoords = e.detail }} showGrid={false} />
    <button on:click={endCrop} class='cancel' title='Zrušit'>
      <span class='material'>close</span>
    </button>
    <button on:click={applyCrop} class='save' title='Uložit'>
      <span class='material'>check</span>
    </button>
  </div>
{/if}

<svelte:window on:keydown={handleKeyDown} />

<input id='headerImage' type='file' accept='image' bind:this={headerInputEl} bind:files on:change={processImage} disabled={uploading} />
<button class='material clear' disabled={!data.custom_header} on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>

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

  input[type=file] {
    display: none;
  }
</style>
