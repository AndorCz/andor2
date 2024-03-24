<script>
  import { lightboxImage } from '@lib/stores'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let userId
  export let data

  let files
  let imageReady = false
  let imageInputEl = null
  let generatingMap = false
  let name = ''
  let description = ''
  let img

  async function showImage () {
    if (files && files[0]) {
      img = document.createElement('img')
      img.src = URL.createObjectURL(files[0])
      await new Promise(resolve => { img.onload = resolve }) // wait for the image to load
      imageReady = true
    }
  }

  async function generateMap () {
    console.log('description', description)
    /*
    try {
      generatingMap = true
      const response = await fetch('/api/game/generateMap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, userId })
      })
      const generatedJson = await response.json() // returns 1024x1024 image in base64
      if (generatedJson.error) { throw generatedJson.error }
      const generatedImage = await loadBase64Image(generatedJson.data[0].b64_json)
      const cropRatio = 0.5
      const croppedImage = cropPortrait(generatedImage, cropRatio) // crop to make narrow, returns canvas
      const resizedImage = await resizePortrait(croppedImage, 140, 140 / cropRatio)
      newPortraitBase64 = resizedImage.base64
      generatingPortrait = false
    } catch (error) { handleError(error) }
    */
  }
</script>

<h1>Přidat mapu do "{data.name}"</h1>

<form method='POST' autocomplete='off'>
  <div class='row'>
    <div class='labels'>
      <label for='mapName'>Název mapy *</label>
    </div>
    <div class='inputs'>
      <input type='text' id='mapName' name='mapName' maxlength='40' bind:value={name} />
    </div>
  </div>

  <div class='row'>
    <div class='labels'>
      <label for='mapDescription'>Popis mapy</label>
    </div>
    <div class='inputs'>
      <TextareaExpandable id='mapDescription' bind:value={description} />
    </div>
  </div>

  <div class='row' id='addImage'>
    <label id='fileSelect' class='button' for='mapImage'>
      <span class='material'>upload</span>
      Nahrát vlastní obrázek
    </label>
    nebo
    <button on:click={generateMap} disabled={description.length < 20}>Generovat z popisu mapy</button>
    <input type='file' accept='image/*' bind:this={imageInputEl} bind:files on:change={showImage} id='mapImage' name='mapImage' />
  </div>

  {#if img}
    <div id='mapPreview'>
      <h3>Náhled</h3>
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions a11y-click-events-have-key-events -->
      <img src={img.src} alt='Náhled mapy' on:click={() => { $lightboxImage = img.src }} />
    </div>
  {/if}

  <center>
    <button type='submit' class='large' onclick='this.disabled=true; this.form.submit()' disabled={!(imageReady && name)}>Přidat mapu</button>
  </center>
</form>

<style>
  .row {
    display: flex;
    margin-top: 30px;
    margin-bottom: 30px;
  }
    .labels {
      width: 15%;
      padding-top: 15px;
    }
    .inputs {
      flex: 1;
    }
      input {
        width: 100%;
      }
  #mapPreview {
    margin-top: 20px;
  }
    #mapPreview img {
      max-width: 100%;
      margin: auto;
      display: block;
      cursor: pointer;
    }
  #addImage {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }
  #fileSelect {
    display: inline-flex;
    gap: 10px;
  }
  #mapImage {
    display: none;
  }
  center {
    margin-top: 50px;
  }
  @media (max-width: 860px) {
    .row {
      display: block;
    }
      .labels {
        width: 100%;
        padding-bottom: 20px;
      }
  }
</style>
