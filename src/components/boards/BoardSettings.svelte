<script>
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview } from '@lib/stores'
  import { getImage } from '@lib/utils'

  export let data = {}
  export let user = {}

  let files
  let saving = false
  let uploading = false

  const isBoardOwner = data.owner.id === user.id
  const originalName = data.name

  async function uploadHeader () {
    uploading = true
    const file = files[0]
    if (file.size < 400000) {
      const image = await getImage(file)
      if (image.width > 1100 && image.height === 226) {
        $headerPreview = URL.createObjectURL(file)
        console.log('header', 'board-' + data.id)
        console.log('image', file)
        const { error: error1 } = await supabase.storage.from('headers').upload('board-' + data.id, file, { upsert: true })
        const { error: error2 } = await supabase.from('boards').update({ custom_header: true }).eq('id', data.id)
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
      const { error: error1 } = await supabase.storage.from('headers').remove(['board-' + data.id])
      const { error: error2 } = await supabase.from('boards').update({ custom_header: false }).eq('id', data.id)
      if (error1 || error2) { return handleError(error1 || error2) }
    }
    files = null
    $headerPreview = '/header.jpg'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička smazána')
  }

  async function updateBoard () {
    saving = true
    const { error } = await supabase.from('boards').update({ name: data.name }).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Změna diskuze uložena')
    saving = false
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

<div class='headline'>
  <h2>{data.name}: Nastavení</h2>
  <button on:click={showBoard} class='material board' title='Zpět do diskuze'>check</button>
</div>

{#if isBoardOwner}
  <h3 class='first'>Vlastní hlavička diskuze</h3>
  Obrázek musí být ve formátu JPG, <b>226 px</b> na výšku a alespoň <b>1100 px</b> na šířku.<br><br>
  <div class='flex'>
    <label class='button' for='header'>Nahrát obrázek</label>
    <input id='header' type='file' accept='image/jpg' bind:files on:change={uploadHeader} disabled={uploading} />
    <button class='material clear' on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>
  </div>

  <h3>Název diskuze</h3>
  <div class='flex'>
    <input type='text' id='boardName' name='boardName' bind:value={data.name} maxlength='80' size='80' />
    <button on:click={updateBoard} disabled={saving || originalName === data.name} class='material'>check</button>
  </div>

  <h3>Smazání diskuze</h3>
  Pozor, toto je nevratná akce.<br><br>
  <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto diskuzi?')) { deleteBoard() } }}>
    <span class='material'>warning</span><span>Smazat diskuzi</span>
  </button>
{:else}
  Tato sekce je jen pro vlastníka diskuze.
{/if}

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
    h3 {
      margin-top: 50px;
      flex: 1;
    }
    .headline button {
      padding: 10px;
      margin-left: 10px;
    }
  input[type=file] {
    display: none;
  }
  .flex {
    gap: 10px;
  }
  .delete {
    display: flex;
    gap: 10px;
  }
</style>
