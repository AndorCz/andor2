<script>
  import { showError } from '@lib/toasts'
  import { resizePortrait } from '@lib/utils'
  import { supabase, handleError } from '@lib/database'

  export let table = 'profiles'
  export let identity = { portrait: '' }

  export let onPortraitChange = null
  export let displayWidth = 140
  export let displayHeight = 200
  export let minWidth = 140
  export let minHeight = 200
  export let saveWidth = 140

  let files
  let uploading = false
  const maxHeight = 600

  async function processPortrait () {
    uploading = true
    if (files && files[0]) {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(files[0])
      await new Promise(resolve => { img.onload = resolve }) // wait for the image to load
      if (img.naturalWidth < minWidth || img.naturalHeight < minHeight) {
        return showError(`Obrázek je příliš malý, minimální rozměry jsou ${minWidth}x${minHeight}px`)
      } else if (img.naturalHeight > 600) {
        return showError(`Obrázek je příliš vysoký, limit je ${maxHeight}px`)
      } else {
        const { base64, height } = resizePortrait(img, saveWidth, maxHeight)
        console.log('height', height)
        displayHeight = height
        img.src = base64
      }
      identity.portrait = img.src || ''
      if (onPortraitChange) { await onPortraitChange(identity.portrait) }
    }
    uploading = false
  }

  // clear preview or identity portrait
  async function clearPortrait (e) {
    e.preventDefault()
    if (window.confirm('Opravdu smazat portrét?')) {
      files = null
      identity.portrait = ''
      const { error } = await supabase.from(table).update({ portrait: null }).eq('id', identity.id)
      if (error) { return handleError(error) }
    }
  }
</script>

<div class='wrapper' style={`--portrait-width: ${displayWidth}px; --portrait-height: ${displayHeight}px`}>
  <label>
    {#if identity.portrait}
      <img src={identity.portrait} class='portrait' alt='portrét' />
    {:else}
      <div class='portrait blank' title={`Obrázek bude zmenšený na šířku ${saveWidth} px`}>Nahrát<br>portrét</div>
    {/if}
    <input type='file' accept='image/*' bind:files on:change={processPortrait} disabled={uploading} />
  </label>
  {#if identity.portrait}
    <button class='clear material clean' on:click={clearPortrait} title='smazat'>close</button>
  {/if}
  <input type='hidden' name='charPortrait' value={identity.portrait || ''} />
</div>

<style>
  .wrapper {
    position: relative;
    width: var(--portrait-width, 140px);
    /*height: var(--portrait-height, 200px);*/
    min-height: 100px;
  }
    .portrait {
      cursor: pointer;
      display: flex;
      object-fit: cover;
      object-position: top;
      width: var(--portrait-width, 140px);
      /*height: var(--portrait-height, 200px);*/
      min-height: 100px;
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
