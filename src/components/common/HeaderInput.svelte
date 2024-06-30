<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import { getImage, getHash } from '@lib/utils'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview, headerCrop } from '@lib/stores'
  import { tooltip } from '@lib/tooltip'

  export let data = {}
  export let section
  export let unit

  let uploading = false
  let files
  let headerInputEl

  onMount(() => {
    window.addEventListener('headerCropped', (e) => uploadHeader(e.detail))
    window.addEventListener('headerCropEnd', clearFiles)
  })

  async function processImage () {
    if (files && files[0]) {
      const file = files[0]
      $headerCrop.file = file
      $headerCrop.image = await getImage(file)
      if ($headerCrop.image.width < 1100) { return showError(`Obrázek má malou šířku (${$headerCrop.image.width}px), je třeba alespoň 1100px`) }
      if ($headerCrop.image.width < 226) { return showError(`Obrázek má malou výšku (${$headerCrop.image.height}px), je třeba alespoň 226px`) }
      $headerCrop.url = URL.createObjectURL(file)
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
  }

  function clearFiles () {
    files = null
    headerInputEl.value = ''
  }
</script>

<input id='headerImage' type='file' accept='image' bind:this={headerInputEl} bind:files on:change={processImage} disabled={uploading} />
<button class='material clear square' disabled={!data.custom_header} on:click={clearHeader} title='Odstranit vlastní hlavičku' use:tooltip>close</button>

<style>
  input[type=file] {
    display: none;
  }
</style>
