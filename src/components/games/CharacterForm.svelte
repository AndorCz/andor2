<script>
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import ButtonLoading from '@components/common/ButtonLoading.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import { cropPortrait, resizePortrait, getImage } from '@lib/utils'
  import { supabase, handleError } from '@lib/database'

  export let isGameOwner
  export let userId
  export let character = {}

  let formEl
  let bioInputEl
  let bioTextareaEl
  let generatingPortrait = false
  let newPortraitBase64
  const isCharacterOwner = userId === character.player

  async function generatePortrait () {
    try {
      generatingPortrait = true
      const response = await fetch('/api/game/generatePortrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearance: character.appearance, userId })
      })
      const generatedBlob = await response.blob() // returns 1024x1024 image
      const generatedImage = await getImage(generatedBlob)
      const cropRatio = 0.5
      const croppedImage = cropPortrait(generatedImage, cropRatio) // crop to make narrow, returns canvas
      const resizedImage = await resizePortrait(croppedImage, 140, 140 / cropRatio)
      newPortraitBase64 = resizedImage.base64
      generatingPortrait = false
    } catch (error) { handleError(error) }
  }

  async function deleteCharacter () {
    const { error } = await supabase.from('characters').delete().eq('id', character.id)
    if (error) { return handleError(error) }
    if (character.game) {
      window.location.href = `/game/${character.game}?toastType=success&toastText=${encodeURIComponent('Postava byla smazána')}`
    } else {
      window.location.href = '/?toastType=success&toastText=' + encodeURIComponent('Postava byla smazána')
    }
  }

  async function submitForm () {
    bioInputEl.value = await bioTextareaEl.getContent()
    this.disabled = true
    this.form.submit()
  }
</script>

{#if userId}
  <form method='POST' autocomplete='off' bind:this={formEl}>
    <div class='row'>
      <div class='labels'><label for='charName'>Jméno *</label></div>
      <div class='inputs'><input type='text' id='charName' name='charName' maxlength='100' bind:value={character.name} /></div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charLooks'>Vzhled</label></div>
      <div class='inputs'><TextareaExpandable {userId} id='charLooks' name='charLooks' bind:value={character.appearance} loading={generatingPortrait} /></div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charIcon'>Portrét</label></div>
      <div class='inputs'>
        <div class='portrait'>
          <PortraitInput identity={character} {newPortraitBase64} table='characters' />
          <span class='flex'>
            <ButtonLoading label='Vygenerovat portrét' handleClick={generatePortrait} loading={generatingPortrait} disabled={!character.appearance || character.appearance?.length < 20} />
            <span class='info'>Dle popisu vzhledu (alespoň 20 znaků)</span>
          </span>
        </div>
      </div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charBio'>Životopis</label></div>
      <div class='inputs'>
        <TextareaExpandable bind:this={bioTextareaEl} {userId} id='charBio' value={character.bio} allowHtml />
        <input type='hidden' bind:this={bioInputEl} name='charBio' />
      </div>
    </div>
    {#if isGameOwner}
      <div class='row'>
        <div class='labels'><label for='storyteller'>Vypravěč</label></div>
        <div class='inputs'><input type='checkbox' id='storyteller' name='storyteller' checked={character.storyteller} /></div>
      </div>
    {/if}
    <center>
      <button on:click={submitForm} class='large' disabled={!character.name}>{#if character.id}Upravit postavu{:else}Vytvořit postavu{/if}</button>
    </center>
  </form>

  {#if isCharacterOwner}
    <details>
      <summary>Smazat postavu</summary>
      <h3>Smazání postavy</h3>
      Pozor, toto je nevratná akce.<br><br>
      <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto postavu?')) { deleteCharacter() } }}>
        <span class='material'>warning</span><span>Smazat postavu</span>
      </button>
    </details>
  {/if}
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
      margin: 30px 0px;
    }
      .labels {
        width: 10%;
        padding-top: 15px;
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
  .delete {
    display: flex;
    gap: 10px;
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
