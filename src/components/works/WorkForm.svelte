<script>
  import { onMount } from 'svelte'
  import { workTagsText, workTagsImage, workTagsMusic, workCategoriesText, workCategoriesImage, workCategoriesMusic } from '@lib/constants'
  import Select from 'svelte-select'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  const { user = {}, type = 'text' } = $props()

  let files = $state()
  let tagItems = $state([])
  let editorRef = $state()
  let previewUrl = $state()
  let selectedTags = $state()
  let tagsInputRef = $state()
  let fileInputRef = $state()
  let categoryItems = $state([])
  let contentInputRef = $state()
  const maxTags = $derived(selectedTags?.length === 3)

  onMount(() => {
    if (type === 'text') {
      tagItems = [...workTagsText]
      categoryItems = [...workCategoriesText]
    } else if (type === 'image') {
      tagItems = [...workTagsImage]
      categoryItems = [...workCategoriesImage]
    } else {
      tagItems = [...workTagsMusic]
      categoryItems = [...workCategoriesMusic]
    }
  })

  const prepareData = async (event) => {
    event.preventDefault()
    if (type === 'text') {
      contentInputRef.value = await editorRef.getContent()
    }
    tagsInputRef.value = selectedTags?.length ? selectedTags.map(tag => tag.value).join(',') : null
    event.target.submit()
  }

  function showPreview () {
    if (files && files[0]) {
      previewUrl = URL.createObjectURL(files[0])
    }
  }
</script>

{#if user.id}
  <form method='POST' autocomplete='off' enctype='multipart/form-data' onsubmit={prepareData}>
    <div class='row'>
      <div class='labels'>
        <label for='workName'>Název</label>
      </div>
      <div class='inputs'>
        <input type='text' id='workName' name='workName' maxlength='80' />
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='workAnnotation'>Anotace</label></div>
      <div class='inputs'><TextareaExpandable placeholder='Popis díla, do seznamu tvorby a novinek' {user} id='workAnnotation' name='workAnnotation' minHeight={80} maxlength={150} /></div>
    </div>

    {#if type === 'text'}
      <div class='row'>
        <div class='labels'>Obsah</div>
        <div class='inputs'>
          <TextareaExpandable {user} bind:this={editorRef} allowHtml minHeight={500} />
          <input type='hidden' name='workContent' bind:this={contentInputRef} />
        </div>
      </div>
    {:else}
      <div class='row'>
        <div class='labels'><label for='workFile'>Soubor</label></div>
        <div class='inputs'>
          <input type='file' bind:this={fileInputRef} bind:files onchange={showPreview} id='workFile' name='workFile' accept={type === 'image' ? 'image/*' : 'audio/*'} />
        </div>
      </div>
      {#if previewUrl && type === 'image'}
        <div class='row'><img src={previewUrl} alt='preview' class='preview'/></div>
      {/if}
    {/if}

    {#if categoryItems.length}
      <div class='row'>
        <div class='labels'>
          <label for='workCategory'>Kategorie</label>
        </div>
        <div class='inputs'>
          <select id='workCategory' name='workCategory'>
            {#each categoryItems as category (category.value)}
              <option value={category.value}>{category.label}</option>
            {/each}
          </select>
        </div>
      </div>
    {/if}

    {#if tagItems.length}
      <div class='row'>
        <div class='labels'><label for='workTags'>Tagy<span class='info'>(max 3)</span></label></div>
        <div class='inputs'>
          <Select items={maxTags ? [] : tagItems} multiple bind:value={selectedTags} placeholder=''>
            {#snippet empty()}<div >Více tagů nelze přidat</div>{/snippet}
          </Select>
          <input type='hidden' name='workTags' bind:this={tagsInputRef} />
        </div>
      </div>
    {/if}
    <input type='hidden' name='workType' value={type} />
    <center>
      <button type='submit' class='large'>Vytvořit</button>
    </center>
  </form>
{:else}
  <div>
    <p>Pro vytvoření nového díla se musíš přihlásit.</p>
  </div>
{/if}

<style>
  form {
    width: 100%;
  }
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
        select {
          width: 400px;
        }
  center {
    margin-top: 20px;
  }
  .preview {
    max-width: 100%;
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
