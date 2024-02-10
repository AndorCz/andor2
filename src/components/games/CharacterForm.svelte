<script>
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import ButtonLoading from '@components/common/ButtonLoading.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import { cropPortrait, resizePortrait, loadBase64Image } from '@lib/utils'
  import { handleError } from '@lib/database'

  export let isGameOwner
  export let userId
  export let character = {}

  let formEl
  let saving = false
  let generatingPortrait = false

  const generatePortrait = async () => {
    try {
      generatingPortrait = true
      const response = await fetch('/api/game/generatePortrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearance: character.appearance, userId })
      })
      const generatedJson = await response.json() // returns 1024x1024 image in base64
      if (generatedJson.error) { throw generatedJson.error }
      const generatedImage = await loadBase64Image(generatedJson.data[0].b64_json)
      const cropRatio = 0.5
      const croppedImage = cropPortrait(generatedImage, cropRatio) // crop to make narrow, returns canvas
      const resizedImage = resizePortrait(croppedImage, 140, 140 / cropRatio) // returns base64 string
      character.portrait = resizedImage
      generatingPortrait = false
    } catch (error) { handleError(error) }
  }
</script>

{#if userId}
  <form method='POST' autocomplete='off' bind:this={formEl}>
    <div class='row'>
      <div class='labels'><label for='charName'>Jméno</label></div>
      <div class='inputs'><input type='text' id='charName' name='charName' maxlength='100' value={character.name || ''} /></div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charLooks'>Vzhled</label></div>
      <div class='inputs'><TextareaExpandable id='charLooks' name='charLooks' bind:value={character.appearance} loading={generatingPortrait} /></div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charIcon'>Portrét</label></div>
      <div class='inputs'>
        <div class='portrait'>
          <PortraitInput identity={character} table='characters' />
          <span>
            <ButtonLoading type='button' label='Vygenerovat portrét' handleClick={generatePortrait} loading={generatingPortrait} disabled={!character.appearance || character.appearance?.length < 20} />
            <span class='info'>Dle popisu vzhledu (alespoň 20 znaků)</span>
          </span>
        </div>
      </div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charBio'>Životopis</label></div>
      <div class='inputs'><TextareaExpandable id='charBio' name='charBio' value={character.bio} /></div>
    </div>
    {#if isGameOwner}
      <div class='row'>
        <div class='labels'><label for='storyteller'>Vypravěč</label></div>
        <div class='inputs'><input type='checkbox' id='storyteller' name='storyteller' checked={character.storyteller} /></div>
      </div>
    {/if}
    <center>
      <button type='submit' on:click={() => { saving = true; formEl.submit() }} disabled={saving}>{#if character.id}Upravit postavu{:else}Vytvořit postavu{/if}</button>
    </center>
  </form>
{:else}
  <div>
    <p>Pro vytvoření nové postavy se musíš přihlásit.</p>
  </div>
{/if}

<style>
  form {
    width: 100%;
  }
    .row {
      display: flex;
      align-items: center;
      margin: 30px 0px;
    }
      .labels {
        width: 10%;
      }
      .inputs {
        flex: 1;
      }
    .portrait {
      display: flex;
      gap: 30px;
    }

    #charName {
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
    .portrait {
      display: block;
    }
    .portrait span {
      display: block;
      margin-top: 20px;
    }
  }
</style>
