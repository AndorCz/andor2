<script>
  import Select from 'svelte-select'
  import { gameTags } from '@lib/constants'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  const { user = {} } = $props()

  let selectedTags = $state()
  let tagsInputRef = $state()
  let showAdvanced = $state(false)

  const tagItems = [...gameTags]
  // const conceptStore = getSavedStore('newSoloConcept', { conceptName: '', promptWorld: '', promptStory: '', promptProtagonist: '', promptLocations: '', promptFactions: '', promptCharacters: '', promptImage: '' })
  const prepareData = async (event) => {
    event.preventDefault()
    tagsInputRef.value = selectedTags?.length ? selectedTags.map(tag => tag.value).join(',') : null
    event.target.submit()
  }

  const maxTags = $derived(selectedTags?.length === 3)
</script>

{#if user.id}
  <form method='POST' autocomplete='off' enctype='multipart/form-data' onsubmit={prepareData}>
    <div class='row'>
      <div class='labels'>
        <label for='conceptName'>Název *</label>
      </div>
      <div class='inputs'>
        <input type='text' id='conceptName' name='conceptName' maxlength='80' />
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='conceptDescription'>Svět</label></div>
      <div class='inputs'><TextareaExpandable placeholder='V jakém světě a časovém období se hra odehrává?' {user} id='promptWorld' name='promptWorld' minHeight={75} maxlength={1000} /></div>
    </div>

    <div class='row'>
      <div class='labels'><label for='conceptStory'>Příběh</label></div>
      <div class='inputs'><TextareaExpandable placeholder='O čem hra bude? Stačí hlavní zápletka nebo motiv.' {user} id='promptStory' name='promptStory' minHeight={75} maxlength={1000} /></div>
    </div>

    <div class='row'>
      <div class='labels'><label for='conceptProtagonist'>Protagonista</label></div>
      <div class='inputs'><TextareaExpandable placeholder='Koho hráč hraje? Je něčím omezen výběr postavy?' {user} id='promptProtagonist' name='promptProtagonist' minHeight={75} maxlength={1000} /></div>
    </div>

    {#if showAdvanced}
      <center><button type='button' class='small' onclick={() => { showAdvanced = false }}>Skrýt pokročilé</button></center>

      <div class='row'>
        <div class='labels'><label for='conceptLocations'>Místa</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaká místa jsou pro hru důležitá? (nepovinné)' {user} id='promptLocations' name='promptLocations' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='conceptFactions'>Frakce</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaké frakce, organizace nebo skupiny jsou ve hře důležité? (nepovinné)' {user} id='promptFactions' name='promptFactions' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='conceptCharacters'>Postavy</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaké postavy jsou pro hru důležité? (nepovinné)' {user} id='promptCharacters' name='promptCharacters' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='conceptImage'>Ilustrace</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Popiš vizuálně obrázek který by hru nejlépe vystihoval (nepovinné)' {user} id='conceptImage' name='conceptImage' minHeight={75} maxlength={500} /></div>
      </div>
    {:else}
      <center><button type='button' class='small' onclick={() => { showAdvanced = true }}>Zobrazit pokročilé</button></center>
    {/if}

    <div class='row'>
      <div class='labels'><label for='soloTags'>Tagy<span class='info'>(max 3)</span></label></div>
      <div class='inputs'>
        <Select items={maxTags ? [] : tagItems} multiple bind:value={selectedTags} placeholder=''>
          <div slot='empty'>Více tagů nelze přidat</div>
        </Select>
        <input type='hidden' name='soloTags' bind:this={tagsInputRef} />
      </div>
    </div>

    <center>
      <button type='submit' class='large' onclick={() => { this.disabled = true; this.form.submit() }}>Vytvořit</button>
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
