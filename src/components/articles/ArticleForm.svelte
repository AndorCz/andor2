<script>
  import { tags } from '@lib/constants'
  import Select from 'svelte-select'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
  let editorRef
  let selectedTags
  let maxTags

  $: maxTags = selectedTags?.length === 5
  $: tagItems = maxTags ? [] : [...tags]
</script>

{#if user.id}
  <form method='POST' autocomplete='off'>
    <div class='row'>
      <div class='labels'>
        <label for='articleName'>Název</label>
      </div>
      <div class='inputs'>
        <input type='text' id='articleName' name='articleName' maxlength='80' />
      </div>
    </div>
    <div class='row'>
      <div class='labels'><label for='articleAnnotation'>Anotace</label></div>
      <div class='inputs'><TextareaExpandable id='articleAnnotation' name='articleAnnotation' /></div>
    </div>
    <div class='row'>
      <div class='labels'>Obsah</div>
      <div class='inputs'><TextareaExpandable bind:this={editorRef} allowHtml minHeight={500} id='articleContent' /></div>
    </div>
    <div class='row'>
      <div class='labels'><label for='articleTags'>Tagy</label></div>
      <div class='inputs'>
        <Select id='articleTags' items={tagItems} multiple bind:value={selectedTags} placeholder='' />
      </div>
    </div>
    <center>
      <button type='submit' class='large'>Vytvořit</button>
    </center>
  </form>
{:else}
  <div>
    <p>Pro vytvoření nového článku se musíš přihlásit.</p>
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
