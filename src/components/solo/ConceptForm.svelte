<script>
  import Select from 'svelte-select'
  import { gameTags } from '@lib/constants'
  import { preventSubmit } from '@lib/utils'
  import { illustrationStyles } from '@lib/solo/solo'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  const { user = {} } = $props()

  let formRef = $state()
  let selectedTags = $state()
  let tagsInputRef = $state()
  let showAdvanced = $state(false)
  let selectedStyle = $state('ink')
  let submitButtonRef = $state()

  const tagItems = [...gameTags]
  const prepareData = async (event) => {
    event.preventDefault()
    submitButtonRef.disabled = true
    const tagsString = selectedTags?.length ? selectedTags.map(tag => tag.value).join(',') : ''
    tagsInputRef.value = tagsString
    event.target.submit()
  }
  const maxTags = $derived(selectedTags?.length === 3)
</script>

{#if user.id}
  <form bind:this={formRef} method='POST' autocomplete='off' enctype='multipart/form-data' onsubmit={prepareData}>
    <div class='row'>
      <div class='labels'>
        <label for='conceptName'>Název *</label>
      </div>
      <div class='inputs'>
        <input type='text' id='conceptName' name='conceptName' maxlength='80' onkeydown={preventSubmit} />
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='promptWorld'>Svět</label></div>
      <div class='inputs'><TextareaExpandable placeholder='V jakém světě a časovém období se hra odehrává?' {user} id='promptWorld' name='promptWorld' minHeight={75} maxlength={1000} /></div>
    </div>

    <div class='row'>
      <div class='labels'><label for='promptPlan'>Příběh</label></div>
      <div class='inputs'><TextareaExpandable placeholder='O čem hra bude? Stačí hlavní zápletka nebo motiv.' {user} id='promptPlan' name='promptPlan' minHeight={75} maxlength={1000} /></div>
    </div>

    <div class='row'>
      <div class='labels'><label for='promptProtagonist'>Protagonista</label></div>
      <div class='inputs'><TextareaExpandable placeholder='Koho hráč hraje? Je něčím omezen výběr postavy?' {user} id='promptProtagonist' name='promptProtagonist' minHeight={75} maxlength={1000} /></div>
    </div>

    {#if showAdvanced}
      <center><button type='button' class='small' onclick={() => { showAdvanced = false }}>Skrýt pokročilé</button></center>

      <div class='row'>
        <div class='labels'><label for='promptLocations'>Místa</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaká místa jsou pro hru důležitá? (nepovinné)' {user} id='promptLocations' name='promptLocations' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='promptFactions'>Frakce</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaké frakce, organizace nebo skupiny jsou ve hře důležité? (nepovinné)' {user} id='promptFactions' name='promptFactions' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='promptCharacters'>Postavy</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Jaké postavy jsou pro hru důležité? (nepovinné)' {user} id='promptCharacters' name='promptCharacters' minHeight={75} maxlength={1000} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='promptHeaderImage'>Obrázek do hlavičky</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Popiš vizuálně obrázek který by hru nejlépe vystihoval (nepovinné)' {user} id='promptHeaderImage' name='promptHeaderImage' minHeight={75} maxlength={500} /></div>
      </div>

      <div class='row'>
        <div class='labels'><label for='promptStorytellerImage'>Avatar vypravěče</label></div>
        <div class='inputs'><TextareaExpandable placeholder='Popiš vizuálně avatar vypravěče (nepovinné)' {user} id='promptStorytellerImage' name='promptStorytellerImage' minHeight={75} maxlength={500} /></div>
      </div>
    {:else}
      <center><button type='button' class='small' onclick={() => { showAdvanced = true }}>Zobrazit pokročilé</button></center>
    {/if}

    <div class='row'>
      <div class='labels'>Styl ilustrace</div>
      <div class='inputs'>
        <select bind:value={selectedStyle} name='illustrationStyle' class='styleSelect'>
          {#each illustrationStyles as style (style.value)}
            <option value={style.value}>{style.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='soloTags'>Tagy<span class='info'>(max 3)</span></label></div>
      <div class='inputs'>
        <Select items={maxTags ? [] : tagItems} multiple bind:value={selectedTags} placeholder=''>
          {#snippet empty()}<div >Více tagů nelze přidat</div>{/snippet}
        </Select>
        <input type='hidden' name='soloTags' bind:this={tagsInputRef} />
      </div>
    </div>

    <center>
      <button type='submit' class='large' bind:this={submitButtonRef}>Vytvořit</button>
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
  .styleSelect {
    min-width: 200px;
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
