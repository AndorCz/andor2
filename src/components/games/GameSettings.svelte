<script>
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview } from '@lib/stores'
  import { getImage } from '@lib/utils'

  export let data
  export let isGameOwner

  let files
  let saving = false
  let uploading = false
  const originalSystem = data.system
  const originalName = data.name

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
      const image = await getImage(file)
      if (image.width > 1100 && image.height === 226) {
        $headerPreview = URL.createObjectURL(file)
        const { error: error1 } = await supabase.storage.from('headers').upload(data.id, file, { upsert: true })
        const { error: error2 } = await supabase.from('games').update({ custom_header: true }).eq('id', data.id)
        if (error1 || error2) { return handleError(error1 || error2) }
        data.custom_header = true
        window.scrollTo({ top: 0, behavior: 'smooth' })
        showSuccess('Hlavička byla uložena')
      } else {
        showError('Nesprávné rozměry obrázku (226 px na výšku, 1100+ px na šířku)')
      }
    } else {
      showError('Obrázek je datově příliš velký (max. 400kB)')
    }
    uploading = false
  }

  async function clearHeader () {
    // clear in db
    if (data.custom_header) {
      const { error: error1 } = await supabase.storage.from('headers').remove([data.id])
      const { error: error2 } = await supabase.from('games').update({ custom_header: false }).eq('id', data.id)
      if (error1 || error2) { return handleError(error1 || error2) }
    }
    files = null
    $headerPreview = '/header.jpg'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička smazána')
  }

  async function updateGame () {
    saving = true
    const { error } = await supabase.from('games').update({ name: data.name, system: data.system }).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Změna hry uložena')
    saving = false
  }
</script>

{#if isGameOwner}
  <h2 class='first'>Vlastní hlavička hry</h2>
  Obrázek musí být ve formátu JPG, <b>226 px</b> na výšku a alespoň <b>1100 px</b> na šířku.<br><br>
  <div class='flex'>
    <label class='button' for='header'>Nahrát obrázek</label>
    <input id='header' type='file' accept='image/jpg' bind:files on:change={uploadHeader} disabled={uploading} />
    <button class='material clear' on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>
  </div>

  <h2>Název hry</h2>
  <div class='flex'>
    <input type='text' id='gameName' name='gameName' bind:value={data.name} maxlength='80' size='80' />
    <button on:click={updateGame} disabled={saving || originalName === data.name} class='material'>check</button>
  </div>

  <h2>Herní systém</h2>
  <div class='flex'>
    <select id='gameSystem' name='gameSystem' bind:value={data.system}>
      <option value='drd1'>Dračí doupě e1.6</option>
      <option value='vampire5e'>Vampire the Masquerade e5</option>
      <option value='-'>Jiný / Bez systému</option>
    </select>
    <button on:click={updateGame} disabled={saving || originalSystem === data.system} class='material'>check</button>
  </div>

  <h2>Smazání hry</h2>
  Pozor, toto je nevratná akce.<br><br>
  <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto hru?')) { deleteGame() } }}>
    <span class='material'>warning</span><span>Smazat hru</span>
  </button>
{:else}
  Tato sekce je jen pro vlastníka hry.
{/if}

<style>
  h2 {
    margin-top: 50px;
  }
  input[type=file] {
    display: none;
  }
  select {
    width: 400px;
  }
  .flex {
    gap: 10px;
  }
  .delete {
    display: flex;
    gap: 10px;
  }
</style>
