<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import { headerPreview } from '@lib/stores'
  import { getImage } from '@lib/utils'
  import { workTags, workCategoriesText } from '@lib/constants'
  import Select from 'svelte-select'

  export let data = {}
  export let user = {}

  let files
  let saving = false
  let uploading = false
  let originalName
  let originalCategory
  let originalTagsString
  let selectedTagsString

  onMount(setOriginal)

  function setOriginal () {
    originalName = data.name
    originalCategory = data.category
    originalTagsString = data.tags?.map(t => t.value).join(',')
  }

  async function uploadHeader () {
    uploading = true
    if (files && files[0]) {
      const file = files[0]
      if (file.size < 400000) {
        const image = await getImage(file)
        if (image.width >= 1100 && image.height === 226) {
          $headerPreview = URL.createObjectURL(file)
          const { error: error1 } = await supabase.storage.from('headers').upload('work-' + data.id, file, { upsert: true })
          const { error: error2 } = await supabase.from('works').update({ custom_header: true }).eq('id', data.id)
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
      const { error: error1 } = await supabase.storage.from('headers').remove(['work-' + data.id])
      const { error: error2 } = await supabase.from('works').update({ custom_header: false }).eq('id', data.id)
      if (error1 || error2) { return handleError(error1 || error2) }
    }
    files = null
    $headerPreview = '/header.jpg'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showSuccess('Hlavička smazána')
  }

  async function updateWork () {
    saving = true
    const tags = data.tags ? data.tags.map(t => t.value) : []
    const { error } = await supabase.from('works').update({ name: data.name, annotation: data.annotation, category: data.category, tags }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    showSuccess('Změna hry uložena')
    saving = false
  }

  async function deleteWork () {
    await supabase.from('works').delete().eq('id', data.id).then(({ error }) => {
      if (error) { return handleError(error) }
      window.location.href = '/works?toastType=success&toastText=' + encodeURIComponent('Dílo bylo smazáno')
    })
  }

  function showWork () {
    window.location.href = `/work/${data.id}`
  }

  $: maxTags = data.tags?.length === 3
  $: tagItems = maxTags ? [] : [...workTags]
  $: selectedTagsString = data.tags?.map(t => t.value).join(',')
</script>

<main>
  <div class='headline'>
    <h2>{data.name}: Nastavení</h2>
    <button on:click={showWork} class='material' title='Zpět do díla'>check</button>
  </div>

  {#if data.author.id === user.id}
    <h3 class='first'>Vlastní hlavička díla</h3>
    Obrázek musí být ve formátu JPG, <b>226 px</b> na výšku a alespoň <b>1100 px</b> na šířku.<br><br>
    <div class='row'>
      <label class='button' for='header'>Nahrát obrázek</label>
      <input id='header' type='file' accept='image/jpg' bind:files on:change={uploadHeader} disabled={uploading} />
      <button class='material clear' on:click={clearHeader} title='Odstranit vlastní hlavičku'>close</button>
    </div>

    <h3>Název díla</h3>
    <div class='row'>
      <input type='text' id='workName' name='workName' bind:value={data.name} maxlength='80' />
      <button on:click={updateWork} disabled={saving || originalName === data.name} class='material'>check</button>
    </div>

    <h3>Kategorie</h3>
    <div class='row'>
      <select id='workCategory' name='workCategory' bind:value={data.category}>
        {#each workCategoriesText as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
      <button on:click={updateWork} disabled={saving || originalCategory === data.category} class='material'>check</button>
    </div>

    <h3>Tagy</h3>
    <div class='row'>
      <Select items={tagItems} multiple bind:value={data.tags} placeholder=''>
        <div slot='empty'>Více tagů nelze přidat</div>
      </Select>
      <button on:click={updateWork} disabled={saving || (selectedTagsString === originalTagsString)} class='material'>check</button>
    </div>

    <h3>Smazání díla</h3>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat toto dílo?')) { deleteWork() } }}>
      <span class='material'>warning</span><span>Smazat dílo</span>
    </button>
  {:else}
    Tato sekce je jen pro vlastníka díla.
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
  #workName {
    width: 100%;
  }
  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
  }
</style>
