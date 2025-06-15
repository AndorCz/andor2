<script>
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import Select from 'svelte-select'
  import { gameTags } from '@lib/constants'

  export let user = {}

  let selectedTags
  let tagsInputRef
  let showAdvanced = false

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
      <div class='labels'><label for='conceptDescription'>Prostředí</label></div>
      <div class='inputs'><TextareaExpandable placeholder='V jakém světě a časovém období se hra odehrává?' {user} id='worldDescription' name='worldDescription' minHeight={75} maxlength={1000} /></div>
    </div>

    <div class='row'>
      <div class='labels'><label for='conceptStory'>Příběh</label></div>
      <div class='inputs'><TextareaExpandable placeholder='O čem hra bude? Stačí hlavní zápletka nebo motiv.' {user} id='conceptStory' name='conceptStory' minHeight={75} maxlength={1000} /></div>
    </div>

    <div class='row'>
      <div class='labels'><label for='conceptProtagonist'>Protagonista</label></div>
      <div class='inputs'><TextareaExpandable placeholder='Koho hráč hraje? Je něčím omezen výběr postavy?' {user} id='conceptProtagonist' name='conceptProtagonist' minHeight={75} maxlength={1000} /></div>
    </div>

    {#if showAdvanced}
      <center><button type='button' class='small' on:click={() => { showAdvanced = false }}>Skrýt pokročilé</button></center>

      <div class='row'>
        <div class='labels'><label for='conceptLocations'>Místa</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaká místa jsou pro hru důležitá?' {user} id='conceptLocations' name='conceptLocations' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='conceptFactions'>Frakce</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaké frakce, organizace nebo skupiny jsou ve hře důležité?' {user} id='conceptFactions' name='conceptFactions' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='conceptCharacters'>Postavy</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaké postavy jsou pro hru důležité?' {user} id='conceptCharacters' name='conceptCharacters' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='soloImage'>Ilustrace</label></div>
        <div class='inputs'>
          <TextareaExpandable placeholder='Popiš vizuálně obrázek který by hru nejlépe vystihoval' {user} id='soloImage' name='soloImage' minHeight={75} maxlength={350} />
        </div>
      </div>
    {:else}
      <center><button type='button' class='small' on:click={() => { showAdvanced = true }}>Zobrazit pokročilé</button></center>
    {/if}

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
