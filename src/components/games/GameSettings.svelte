<script>
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview } from '@lib/stores'

  export let data
  export let isGameOwner

  let files
  let uploading = false

  async function deleteGame () {
    await supabase.from('games').delete().eq('id', data.id).then(({ error }) => {
      if (error) { return handleError(error) }
      window.location.href = '/games?toastType=success&toastText=' + encodeURIComponent('Hra byla smazána')
    })
  }

  async function uploadHeader () {
    uploading = true
    const file = files[0]
    if (file.size < 400000) {
      $headerPreview = URL.createObjectURL(file)
      const { error: error1 } = await supabase.storage.from('headers').upload(data.name, file, { upsert: true })
      const { error: error2 } = await supabase.from('games').update({ custom_header: true }).eq('id', data.id)
      if (error1 || error2) { return handleError(error1 || error2) }
      data.custom_header = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
      showSuccess('Hlavička byla uložena')
    } else {
      showError('Obrázek je datově příliš velký (max. 400kB)')
    }
    uploading = false
  }

  async function clearHeader () {
    // clear in db
    if (data.custom_header) {
      const { error: error1 } = await supabase.storage.from('headers').remove([data.name])
      const { error: error2 } = await supabase.from('games').update({ custom_header: false }).eq('id', data.id)
      if (error1 || error2) { return handleError(error1 || error2) }
    }
    files = null
    $headerPreview = '/header.jpg'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička smazána')
  }
</script>

{#if isGameOwner}
  <h2 class='first'>Vlastní hlavička hry</h2>
  Obrázek musí být ve formátu JPG, <b>226 px</b> na výšku a alespoň <b>1100 px</b> na šířku.<br><br>
  <div class='flex'>
    <label class='button' for='header'>Nahrát obrázek</label>
    <input id='header' type='file' accept='image/jpg' bind:files on:change={uploadHeader} disabled={uploading} />
    <button class='material-symbols clear' on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>
  </div>

  <h2>Smazání hry</h2>
  Pozor, toto je nevratná akce.<br><br>
  <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto hru?')) { deleteGame() } }}>
    <span class='material-symbols'>warning</span><span>Smazat hru</span>
  </button>
{:else}
  Tato sekce je jen pro vlastníka hry.
{/if}

<style>
  .delete {
    display: flex;
    gap: 10px;
  }
  h2 {
    margin-top: 50px;
  }
  input[type=file] {
    display: none;
  }
  .flex {
    gap: 10px;
  }
</style>
