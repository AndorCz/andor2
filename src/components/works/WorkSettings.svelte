<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database-browser'
  import { workTagsText, workTagsImage, workTagsMusic, workCategoriesText, workCategoriesImage, workCategoriesMusic } from '@lib/constants'
  import Select from 'svelte-select'
  import HeaderInput from '@components/common/HeaderInput.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  let { data = $bindable({}), user = {} } = $props()

  function normalizeTags () {
    if (Array.isArray(data.tags) && typeof data.tags[0] === 'string') {
      const source = data.type === 'text' ? workTagsText : data.type === 'image' ? workTagsImage : workTagsMusic
      data.tags = data.tags.map(tag => source.find(t => t.value === tag) || { value: tag, label: tag })
    }
  }

  let saving = $state(false)
  let originalName = $state()
  let originalAnnotation = $state()
  let originalCategory = $state()
  let originalTagsString = $state()
  let headlineEl = $state()
  let tagItems = $state([])
  let categoryItems = $state([])
  const selectedTagsString = $derived(data.tags?.map(t => t.value).join(','))

  onMount(() => {
    if (data.type === 'text') {
      tagItems = [...workTagsText]
      categoryItems = [...workCategoriesText]
    } else if (data.type === 'image') {
      tagItems = [...workTagsImage]
      categoryItems = [...workCategoriesImage]
    } else {
      tagItems = [...workTagsMusic]
      categoryItems = [...workCategoriesMusic]
    }

    normalizeTags()
    setOriginal()
    const observer = new IntersectionObserver(([e]) => e.target.classList.toggle('pinned', e.intersectionRatio < 1), { threshold: [1] })
    observer.observe(headlineEl)
  })

  function setOriginal () {
    normalizeTags()
    originalName = data.name
    originalAnnotation = data.annotation
    originalCategory = data.category
    originalTagsString = data.tags?.map(t => t.value).join(',')
  }

  async function updateWork () {
    saving = true
    const tags = data.tags ? data.tags.map(t => t.value ?? t) : []
    const { error } = await supabase.from('works').update({ name: data.name, annotation: data.annotation, category: data.category, tags }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    showSuccess('Změna díla uložena')
    saving = false
  }

  async function deleteWork () {
    const { error } = await supabase.from('works').delete().eq('id', data.id)
    if (error) { return handleError(error) }
    window.location.href = '/works?toastType=success&toastText=' + encodeURIComponent('Dílo bylo smazáno')
  }

  function showWork () {
    window.location.href = `/work/${data.id}`
  }

  const maxTags = $derived(data.tags?.length === 3)
</script>

<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/work/{data.id}' class='backlink'>{data.name}</a>
    <h1>Nastavení</h1>
    <button onclick={showWork} class='material square back' title='Zpět do díla' use:tooltip>arrow_back</button>
  </div>
</div>
<main>
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
      <button onclick={updateWork} disabled={saving || originalName === data.name} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Anotace</h2>
    <div class='row'>
      <TextareaExpandable {user} id='workAnnotation' name='workAnnotation' bind:value={data.annotation} maxlength={150} />
      <button onclick={updateWork} disabled={saving || originalAnnotation === data.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    {#if categoryItems.length}
      <h2>Kategorie</h2>
      <div class='row'>
        <select id='workCategory' name='workCategory' bind:value={data.category}>
          {#each categoryItems as category (category.value)}
            <option value={category.value}>{category.label}</option>
          {/each}
        </select>
        <button onclick={updateWork} disabled={saving || originalCategory === data.category} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>
    {/if}

    {#if tagItems.length}
      <h2>Tagy</h2>
      <div class='row'>
        <Select items={maxTags ? [] : tagItems} multiple bind:value={data.tags} placeholder=''>
          {#snippet empty()}<div >Více tagů nelze přidat</div>{/snippet}
        </Select>
        <button onclick={updateWork} disabled={saving || (selectedTagsString === originalTagsString)} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>
    {/if}

    <h2>Smazání díla</h2>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' onclick={() => { if (confirm('Opravdu chcete smazat toto dílo?')) { deleteWork() } }}>
      <span class='material'>warning</span><span>Smazat dílo</span>
    </button>
  {:else}
    Tato sekce je jen pro vlastníka díla.
  {/if}
</main>

<style>
  .headline {
    position: sticky;
    top: -1px; /* needed for observer */
    background-color: var(--panel);
    padding-top: 10px;
    padding-bottom: 10px;
    margin: 0px -30px;
    z-index: 10;
  }
    .wrapper {
      max-width: 600px;
      margin: auto;
    }
      .headline .backlink {
        font-family: var(--headlineFont);
        display: inline-block;
        font-size: inherit;
      }
      .headline h1 {
        margin: 0px;
        margin-top: -5px;
        padding: 0px;
      }
      .back {
        position: absolute;
        top: 8px;
        right: 20px;
      }

  main {
    max-width: 600px;
    margin: auto;
  }

  h2 {
    margin-top: 50px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
    input[type=text], select {
      width: 100%;
    }
  .delete {
    display: flex;
    gap: 10px;
  }

  @media (max-width: 1200px) {
    .headline {
      margin: 0px -30px;
    }
  }

  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
    .headline {
      margin: 0px -15px;
    }
  }
</style>
