<script>
  import { workTags, workCategoriesText } from '@lib/constants'
  import Select from 'svelte-select'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  let editorRef
  let selectedTags
  let maxTags
  let contentInputRef
  let tagsInputRef

  const prepareData = async (event) => {
    event.preventDefault()
    contentInputRef.value = await editorRef.getContent()
    tagsInputRef.value = selectedTags?.length ? selectedTags.map(tag => tag.value).join(',') : null
    event.target.submit()
  }

  $: maxTags = selectedTags?.length === 3
  $: tagItems = maxTags ? [] : [...workTags]
</script>

{#if user.id}
  <form method='POST' autocomplete='off' on:submit={prepareData}>
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
      <div class='inputs'><TextareaExpandable userId={user.id} id='workAnnotation' name='workAnnotation' minHeight={80} maxlength={150} /></div>
    </div>

    <div class='row'>
      <div class='labels'>Obsah</div>
      <div class='inputs'>
        <TextareaExpandable userId={user.id} bind:this={editorRef} allowHtml minHeight={500} />
        <input type='hidden' name='workContent' bind:this={contentInputRef} />
      </div>
    </div>

    <div class='row'>
      <div class='labels'>
        <label for='workCategory'>Kategorie</label>
      </div>
      <div class='inputs'>
        <select id='workCategory' name='workCategory'>
          {#each workCategoriesText as category}
            <option value={category.value}>{category.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='workTags'>Tagy<span class='info'>(max 3)</span></label></div>
      <div class='inputs'>
        <Select items={tagItems} multiple bind:value={selectedTags} placeholder=''>
          <div slot='empty'>Více tagů nelze přidat</div>
        </Select>
        <input type='hidden' name='workTags' bind:this={tagsInputRef} />
      </div>
    </div>
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
