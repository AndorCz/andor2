<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview } from '@lib/stores'
  import { getImage } from '@lib/utils'

  export let data = {}
  export let user = {}

  let files
  let headerInputEl
  let saving = false
  let uploading = false
  let originalName

  onMount(setOriginal)

  function setOriginal () {
    originalName = data.name
  }

  async function uploadHeader () {
    if (files && files[0]) {
      const file = files[0]
      if (file.size < 400000) {
        uploading = true
        const image = await getImage(file)
        headerInputEl.value = ''
        if (image.width >= 1100 && image.height === 226) {
          $headerPreview = URL.createObjectURL(file)
          const { error: error1 } = await supabase.storage.from('headers').upload('board-' + data.id, file, { upsert: true })
          const { error: error2 } = await supabase.from('boards').update({ custom_header: true }).eq('id', data.id)
          if (error1 || error2) { return handleError(error1 || error2) }
          data.custom_header = true
          window.scrollTo({ top: 0, behavior: 'smooth' })
          showSuccess('Hlavička byla uložena')
          uploading = false
          await fetch('/api/cache?type=boards', { method: 'GET' }) // clear cache
        } else {
          showError(`Nesprávné rozměry obrázku (226 px na výšku, 1100+ px na šířku), obrázek má ${image.width} x ${image.height}`)
        }
      } else {
        showError('Obrázek je datově příliš velký (max. 400kB)')
      }
    }
  }

  async function clearHeader () {
    // clear in db
    if (data.custom_header) {
      const { error: error1 } = await supabase.storage.from('headers').remove(['board-' + data.id])
      const { error: error2 } = await supabase.from('boards').update({ custom_header: false }).eq('id', data.id)
      if (error1 || error2) { return handleError(error1 || error2) }
    }
    data.custom_header = false
    files = null
    $headerPreview = '/header.jpg'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička smazána')
    await fetch('/api/cache?type=boards', { method: 'GET' }) // clear cache
  }

  async function updateBoard () {
    saving = true
    const { error } = await supabase.from('boards').update({ name: data.name }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    showSuccess('Změna diskuze uložena')
    saving = false
    await fetch('/api/cache?type=boards', { method: 'GET' }) // clear cache
  }

  async function deleteBoard () {
    await supabase.from('boards').delete().eq('id', data.id).then(({ error }) => {
      if (error) { return handleError(error) }
      window.location.href = '/boards?toastType=success&toastText=' + encodeURIComponent('Diskuze byla smazána')
    })
  }

  function showBoard () {
    window.location.href = `/board/${data.id}`
  }
</script>

<main>
  <div class='headline'>
    <h2>Nastavení diskuze "{data.name}"</h2>
    <button on:click={showBoard} class='material' title='Zpět do diskuze'>check</button>
  </div>

  {#if data.owner.id === user.id}
    <h3 class='first'>Vlastní hlavička</h3>
    Obrázek musí být ve formátu JPG, <b>226 px</b> na výšku a alespoň <b>1100 px</b> na šířku.<br><br>
    <div class='row'>
      <label class='button' for='header'>Nahrát obrázek</label>
      <input id='header' type='file' accept='image/jpg' bind:this={headerInputEl} bind:files on:change={uploadHeader} disabled={uploading} />
      <button class='material clear' disabled={!data.custom_header} on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>
    </div>

    <h3>Název</h3>
    <div class='row'>
      <input type='text' id='boardName' name='boardName' bind:value={data.name} maxlength='80' />
      <button on:click={updateBoard} disabled={saving || (originalName === data.name)} class='material'>check</button>
    </div>

    <h3>Smazání diskuze</h3>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto diskuzi?')) { deleteBoard() } }}>
      <span class='material'>warning</span><span>Smazat diskuzi</span>
    </button>
  {:else}
    Tato sekce je jen pro vlastníka diskuze.
  {/if}
</main>

<style>
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
  #boardName {
    width: 100%;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .delete {
    display: flex;
    gap: 10px;
  }
  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
  }
</style>
