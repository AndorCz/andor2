<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import { workTags, workCategoriesText } from '@lib/constants'
  import Select from 'svelte-select'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import HeaderInput from '@components/common/HeaderInput.svelte'

  export let data = {}
  export let user = {}

  let saving = false
  let originalName
  let originalAnnotation
  let originalCategory
  let originalTagsString
  let selectedTagsString

  onMount(setOriginal)

  function setOriginal () {
    originalName = data.name
    originalAnnotation = data.annotation
    originalCategory = data.category
    originalTagsString = data.tags?.map(t => t.value).join(',')
  }

  async function updateWork () {
    saving = true
    const tags = data.tags ? data.tags.map(t => t.value) : []
    const { error } = await supabase.from('works').update({ name: data.name, annotation: data.annotation, category: data.category, tags }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    showSuccess('Změna díla uložena')
    saving = false
    // await fetch('/api/cache?type=works', { method: 'GET' }) // clear cache
  }

  async function deleteWork () {
    const { error } = await supabase.from('works').delete().eq('id', data.id)
    if (error) { return handleError(error) }
    // await fetch('/api/cache?type=works', { method: 'GET' }) // clear cache
    window.location.href = '/works?toastType=success&toastText=' + encodeURIComponent('Dílo bylo smazáno')
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
    <h1>Nastavení díla "{data.name}"</h1>
    <button on:click={showWork} class='material square' title='Zpět do díla'>check</button>
  </div>

  {#if data.owner.id === user.id}
    <h2 class='first'>Vlastní hlavička</h2>
    Obrázek musí mít velikost alespoň 1100×226 px<br><br>
    <div class='row'>
      <label class='button' for='headerImage'>Nahrát obrázek</label>
      <HeaderInput {data} section='works' unit='work' />
    </div>

    <h2>Název</h2>
    <div class='row'>
      <input type='text' id='workName' name='workName' bind:value={data.name} maxlength='80' />
      <button on:click={updateWork} disabled={saving || originalName === data.name} class='material save'>check</button>
    </div>

    <h2>Anotace</h2>
    <div class='row'>
      <TextareaExpandable userId={user.id} id='workAnnotation' name='workAnnotation' bind:value={data.annotation} maxlength={150} />
      <button on:click={updateWork} disabled={saving || originalAnnotation === data.annotation} class='material save'>check</button>
    </div>

    <h2>Kategorie</h2>
    <div class='row'>
      <select id='workCategory' name='workCategory' bind:value={data.category}>
        {#each workCategoriesText as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
      <button on:click={updateWork} disabled={saving || originalCategory === data.category} class='material save'>check</button>
    </div>

    <h2>Tagy</h2>
    <div class='row'>
      <Select items={tagItems} multiple bind:value={data.tags} placeholder=''>
        <div slot='empty'>Více tagů nelze přidat</div>
      </Select>
      <button on:click={updateWork} disabled={saving || (selectedTagsString === originalTagsString)} class='material save'>check</button>
    </div>

    <h2>Smazání díla</h2>
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
    h1 {
      margin: 0px;
    }
    .headline button {
      margin-left: 10px;
    }

  h2 {
    margin-top: 50px;
  }
  .row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }
    #workName {
      width: 100%;
    }
    button.save {
      height: 60px;
    }
    select {
      width: 100%;
      max-width: 400px;
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
