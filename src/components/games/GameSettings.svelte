<script>
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview } from '@lib/stores'
  import { getImage } from '@lib/utils'
  import { systems, categories } from '@lib/constants'

  export let data = {}
  export let user = {}

  let files
  let saving = false
  let uploading = false

  const isGameOwner = data.owner.id === user.id
  const originalSystem = data.system
  const originalName = data.name
  const originalCategory = data.category

  async function uploadHeader () {
    uploading = true
    if (files && files[0]) {
      const file = files[0]
      if (file.size < 400000) {
        const image = await getImage(file)
        if (image.width >= 1100 && image.height === 226) {
          $headerPreview = URL.createObjectURL(file)
          const { error: error1 } = await supabase.storage.from('headers').upload('game-' + data.id, file, { upsert: true })
          const { error: error2 } = await supabase.from('games').update({ custom_header: true }).eq('id', data.id)
          if (error1 || error2) { return handleError(error1 || error2) }
          data.custom_header = true
          window.scrollTo({ top: 0, behavior: 'smooth' })
          showSuccess('Hlavička byla uložena')
        } else {
          showError(`Nesprávné rozměry obrázku (226 px na výšku, 1100+ px na šířku), obrázek má ${image.width} x ${image.height}`)
        }
      } else {
        showError('Obrázek je datově příliš velký (max. 400kB)')
      }
    }
    uploading = false
  }

  async function clearHeader () {
    // clear in db
    if (data.custom_header) {
      const { error: error1 } = await supabase.storage.from('headers').remove(['game-' + data.id])
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
    const { error } = await supabase.from('games').update({ name: data.name, category: data.category, system: data.system }).eq('id', data.id)
    if (error) { return handleError(error) }

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
  }

  async function deleteGame () {
    await supabase.from('games').delete().eq('id', data.id).then(({ error }) => {
      if (error) { return handleError(error) }
      window.location.href = '/games?toastType=success&toastText=' + encodeURIComponent('Hra byla smazána')
    })
  }

  function showGame () {
    window.location.href = `/game/${data.id}`
  }
</script>

<main>
  <div class='headline'>
    <h2>{data.name}: Nastavení</h2>
    <button on:click={showGame} class='material' title='Zpět do hry'>check</button>
  </div>

  {#if isGameOwner}
    <h3 class='first'>Vlastní hlavička hry</h3>
    Obrázek musí být ve formátu JPG, <b>226 px</b> na výšku a alespoň <b>1100 px</b> na šířku.<br><br>
    <div class='row'>
      <label class='button' for='header'>Nahrát obrázek</label>
      <input id='header' type='file' accept='image/jpg' bind:files on:change={uploadHeader} disabled={uploading} />
      <button class='material clear' on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>
    </div>

    <h3>Název hry</h3>
    <div class='row'>
      <input type='text' id='gameName' name='gameName' bind:value={data.name} maxlength='80' />
      <button on:click={updateGame} disabled={saving || originalName === data.name} class='material'>check</button>
    </div>

    <h3>Kategorie</h3>
    <div class='row'>
      <select id='gameCategory' name='gameCategory' bind:value={data.category}>
        {#each categories as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || originalCategory === data.category} class='material'>check</button>
    </div>

    <h3>Herní systém</h3>
    <div class='row'>
      <select id='gameSystem' name='gameSystem' bind:value={data.system}>
        {#each systems as system}
          <option value={system.value}>{system.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || originalSystem === data.system} class='material'>check</button>
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
