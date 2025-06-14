<script>
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Select from 'svelte-select'
  import { gameTags } from '@lib/constants'

  export let user = {}
  let selectedTags
  let tagsInputRef

  const prepareData = async (event) => {
    event.preventDefault()
    tagsInputRef.value = selectedTags?.length ? selectedTags.map(tag => tag.value).join(',') : null
    event.target.submit()
  }

  $: maxTags = selectedTags?.length === 3
</script>

{#if user.id}
  <form method='POST' autocomplete='off' enctype='multipart/form-data' on:submit={prepareData}>
    <div class='row'>
      <div class='labels'>
        <label for='gameName'>Název *</label>
      </div>
      <div class='inputs'>
        <input type='text' id='gameName' name='gameName' maxlength='80' />
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='conceptAnnotation'>Anotace</label></div>
      <div class='inputs'><TextareaExpandable placeholder='Popiš o čem by hra měla být, v jakém světě se odehrává, jakou by měla mít atmosféru apod. Na základě tohoto popisu AI vygeneruje konkrétní příběhové linie.' {user} id='conceptAnnotation' name='conceptAnnotation' minHeight={150} maxlength={350} /></div>
    </div>

    <!-- 2DO: require image, offer generating -->
    <div class='row'>
      <div class='labels'><label for='soloImage'>Obrázek</label></div>
      <div class='inputs'>
        <input type='file' id='soloImage' name='soloImage' accept='image/*' />
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='workTags'>Tagy<span class='info'>(max 3)</span></label></div>
      <div class='inputs'>
        <Select items={maxTags ? [] : gameTags} multiple bind:value={selectedTags} placeholder=''>
          <div slot='empty'>Více tagů nelze přidat</div>
        </Select>
        <input type='hidden' name='workTags' bind:this={tagsInputRef} />
      </div>
    </div>

    <center>
      <button type='submit' class='large' onclick='this.disabled=true; this.form.submit()'>Vytvořit</button>
    </center>
  </form>
{:else}
  <div>
    <p>Pro vytvoření nového herního konceptu se musíš přihlásit.</p>
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
