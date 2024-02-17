<script>
  import { onMount } from 'svelte'
  import { getImage, cropImageToBlob } from '@lib/utils'
  import { headerPreview } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import { gameSystems, gameCategories } from '@lib/constants'
  import Cropper from 'svelte-easy-crop'

  export let data = {}
  export let user = {}

  let files
  let headerInputEl
  let saving = false
  let uploading = false
  let originalSystem
  let originalName
  let originalCategory

  const aspect = 1100 / 226
  let cropCoords
  let cropping = false
  let cropModalEl
  let newHeaderUrl
  let newHeaderEl

  onMount(setOriginal)

  function setOriginal () {
    originalName = data.name
    originalSystem = data.system
    originalCategory = data.category
  }

  async function updateGame () {
    saving = true
    const { error } = await supabase.from('games').update({ name: data.name, category: data.category, system: data.system }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    // update AI storyteller if system changed
    /*
    if (originalSystem !== data.system) {
      const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: data.owner.id, system: data.system, storyteller: data.openai_storyteller, annotation: data.annotation, secrets: data.secrets }), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
    }
    */
    showSuccess('Změna hry uložena')
    saving = false
    await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
  }

  async function deleteGame () {
    await supabase.from('games').delete().eq('id', data.id).then(({ error }) => {
      if (error) { return handleError(error) }
      window.location.href = '/games?toastType=success&toastText=' + encodeURIComponent('Hra byla smazána')
    })
    await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
  }

  function showGame () {
    window.location.href = `/game/${data.id}`
  }

  // Header image

  async function processImage () {
    if (files && files[0]) {
      const file = files[0]
      newHeaderEl = await getImage(file)
      if (newHeaderEl.width < 1100) { return showError(`Obrázek má malou šířku (${newHeaderEl.width}px), je třeba alespoň 1100px`) }
      if (newHeaderEl.width < 226) { return showError(`Obrázek má malou výšku (${newHeaderEl.height}px), je třeba alespoň 226px`) }
      if (newHeaderEl.width >= 1100 && newHeaderEl.width < 2000 && newHeaderEl.height === 226) { // Correct size
        uploadHeader(file)
      } else { // too large - crop
        cropping = true
        newHeaderUrl = URL.createObjectURL(file)
      }
    }
  }

  async function uploadHeader (file) {
    uploading = true
    $headerPreview = URL.createObjectURL(file)
    const { error: error1 } = await supabase.storage.from('headers').upload('game-' + data.id, file, { upsert: true })
    const { error: error2 } = await supabase.from('games').update({ custom_header: true }).eq('id', data.id)
    if (error1 || error2) { return handleError(error1 || error2) }
    data.custom_header = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička byla uložena')
    uploading = false
    await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
  }

  async function clearHeader () { // clear in db
    if (data.custom_header) {
      const { error: error1 } = await supabase.storage.from('headers').remove(['game-' + data.id])
      const { error: error2 } = await supabase.from('games').update({ custom_header: false }).eq('id', data.id)
      if (error1 || error2) { return handleError(error1 || error2) }
    }
    data.custom_header = false
    files = null
    $headerPreview = '/header.jpg'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička smazána')
    await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
  }

  // Cropping

  async function applyCrop () {
    const croppedImageBlob = await cropImageToBlob(newHeaderEl, cropCoords, { width: 1100, height: 226 }, files[0].type)
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

<main>
  <div class='headline'>
    <h2>Nastavení hry "{data.name}"</h2>
    <button on:click={showGame} class='material' title='Zpět do hry'>check</button>
  </div>

  {#if data.owner.id === user.id}
    <h3 class='first'>Vlastní hlavička</h3>
    Obrázek musí mít velikost alespoň 1100×226 px<br><br>
    <div class='row'>
      <label class='button' for='header'>Nahrát obrázek</label>
      <input id='header' type='file' accept='image' bind:this={headerInputEl} bind:files on:change={processImage} disabled={uploading} />
      <button class='material clear' disabled={!data.custom_header} on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>
    </div>

    <h3>Název</h3>
    <div class='row'>
      <input type='text' id='gameName' name='gameName' bind:value={data.name} maxlength='80' />
      <button on:click={updateGame} disabled={saving || (originalName === data.name)} class='material'>check</button>
    </div>

    <h3>Kategorie</h3>
    <div class='row'>
      <select id='gameCategory' name='gameCategory' bind:value={data.category}>
        {#each gameCategories as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || (originalCategory === data.category)} class='material'>check</button>
    </div>

    <h3>Herní systém</h3>
    <div class='row'>
      <select id='gameSystem' name='gameSystem' bind:value={data.system}>
        {#each gameSystems as system}
          <option value={system.value}>{system.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || (originalSystem === data.system)} class='material'>check</button>
    </div>

    <h3>Smazání hry</h3>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto hru?')) { deleteGame() } }}>
      <span class='material'>warning</span><span>Smazat hru</span>
    </button>
  {:else}
    Tato sekce je jen pro vlastníka hry.
  {/if}
</main>

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

  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
    h2 {
      margin: 0px;
    }
    .headline button {
      padding: 10px;
      margin-left: 10px;
    }

  h3 {
    margin-top: 50px;
  }
  input[type=file] {
    display: none;
  }
  select {
    width: 100%;
    max-width: 400px;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .delete {
    display: flex;
    gap: 10px;
  }
  #gameName {
    width: 100%;
  }
  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
  }
</style>
