<script>
  import { onMount } from 'svelte'
  import { getImageUrl } from '@lib/utils'
  import { lightboxImage } from '@lib/stores'
  import { supabase, handleError } from '@lib/database-browser'
  import ButtonLoading from '@components/common/ButtonLoading.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let map = { name: '', description: '' }
  export let user
  export let game

  const mapName = map.name
  let files
  let imageInputEl
  let descriptionTextareaEl
  let descriptionInputEl
  let imageGeneratedUrl
  let imageReady = false
  let generatingMap = false
  let img

  onMount(async () => {
    if (map.id) {
      const imgUrl = await getImageUrl(supabase, `${game.id}/${map.id}?${map.image}`, 'maps')
      await addImage(imgUrl)
    }
  })

  async function addImage (url) {
    img = document.createElement('img')
    img.src = url
    await new Promise(resolve => { img.onload = resolve }) // wait for the image to load
    imageReady = true
  }

  async function showImageFromFile () {
    if (files && files[0]) {
      addImage(URL.createObjectURL(files[0]))
      imageGeneratedUrl = null
    }
  }

  async function generateMap () {
    try {
      generatingMap = true
      const response = await fetch('/api/game/generateMap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: map.description, userId: user.id })
      })
      const generatedJson = await response.json() // returns 1024x1024 image
      if (generatedJson.error) { throw generatedJson.error }
      imageGeneratedUrl = generatedJson.data[0].url
      addImage(imageGeneratedUrl)
      generatingMap = false
      imageInputEl.value = null
    } catch (error) { handleError(error) }
  }

  async function submitForm () {
    descriptionInputEl.value = await descriptionTextareaEl.getContent()
    this.disabled = true
    this.form.submit()
  }
</script>

<h1>
  {#if map.id}
    Upravit mapu "{mapName}"
  {:else}
    Přidat mapu do "{game.name}"
  {/if}
</h1>

<form method='POST' autocomplete='off' enctype='multipart/form-data'>
  <div class='row'>
    <div class='labels'>
      <label for='mapName'>Název mapy *</label>
    </div>
    <div class='inputs'>
      <input type='text' id='mapName' name='mapName' maxlength='40' bind:value={map.name} />
    </div>
  </div>

  <div class='row' id='addImage'>
    <label id='fileSelect' class='button' for='mapImage'>
      <span class='material'>upload</span>
      Nahrát vlastní obrázek
    </label>
    nebo
    <ButtonLoading label='Generovat z popisu mapy' handleClick={generateMap} loading={generatingMap} disabled={map.description?.length < 20} />
    <input type='file' accept='image/*' bind:this={imageInputEl} bind:files on:change={showImageFromFile} id='mapImage' name='mapImage' />
    <input type='hidden' name='mapGeneratedUrl' bind:value={imageGeneratedUrl} />
  </div>

  <div class='row'>
    <div class='labels'>
      <label for='mapDescription'>Popis mapy</label>
    </div>
    <div class='inputs'>
      <TextareaExpandable bind:this={descriptionTextareaEl} loading={generatingMap} id='mapDescription' value={map.description} {user} allowHtml />
      <input type='hidden' bind:this={descriptionInputEl} name='mapDescription' />
    </div>
  </div>

  {#if img}
    <div id='mapPreview'>
      <h3>Náhled</h3>
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions a11y-click-events-have-key-events -->
      <img src={img.src} alt='Náhled mapy' on:click={() => { $lightboxImage = img.src }} />
    </div>
  {/if}

  <div class='row'>
    <div class='labels'><label for='mapDescription'>Skrytá</label></div>
    <div class='inputs'><input type='checkbox' id='mapHidden' name='mapHidden' bind:checked={map.hidden} /></div>
  </div>

  <center>
    <button class='large' on:click={submitForm} disabled={!(imageReady && map.name)}>
      {#if map.id}Uložit mapu{:else}Přidat mapu{/if}
    </button>
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
      input[type='text'] {
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
