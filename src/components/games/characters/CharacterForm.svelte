<script>
  import { supabase, handleError } from '@lib/database-browser'
  import { cropPortrait, resizePortrait, getImage, redirectWithToast } from '@lib/utils'
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import ButtonLoading from '@components/common/ButtonLoading.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import { showError } from '@lib/toasts'

  let { isStoryteller, isGameOwner, user, character = $bindable() } = $props()
  console.log('character', character)

  let formEl = $state()
  let bioInputEl = $state()
  let bioTextareaEl = $state()
  let looksInputEl = $state()
  let looksTextareaEl = $state()
  let generatingPortrait = $state(false)
  let newPortraitBase64 = $state()
  const isCharacterOwner = user.id === character.player

  async function generatePortrait () {
    try {
      generatingPortrait = true
      const response = await fetch('/api/game/generatePortrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearance: character.appearance, userId: user.id })
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
    if (character.game != null) {
      showError('Postava je ve hře, není možné ji smazat')
    } else {
      // Actually delete - do not use for now
      // const { error: updateError } = await supabase.rpc('delete_my_character', { character_id: character.id })
      const { error: updateError } = await supabase.from('characters').update({ state: 'deleted', storyteller: 'false' }).eq('id', character.id)
      if (updateError) { return handleError(updateError) }
      if (character.game) {
        redirectWithToast({ url: window.location.origin + `/game/${character.game}?tab=chars`, toastType: 'success', toastText: 'Postava byla smazána' })
      } else {
        redirectWithToast({ url: window.location.origin, toastType: 'success', toastText: 'Postava byla smazána' })
      }
    }
  }

  async function submitForm () {
    bioInputEl.value = await bioTextareaEl.getContent()
    looksInputEl.value = await looksTextareaEl.getContent()
    this.disabled = true
    formEl.submit()
  }
</script>

{#if user.id && ((character.player === user.id) || !character.id)}
  <form method='POST' autocomplete='off' bind:this={formEl}>
    <div class='row'>
      <div class='labels'><label for='charName'>Jméno *</label></div>
      <div class='inputs'><input type='text' id='charName' name='charName' maxlength='49' bind:value={character.name} /></div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charLooks'>Vzhled (veřejný)</label></div>
      <div class='inputs'>
        <TextareaExpandable bind:this={looksTextareaEl} bind:value={character.appearance} {user} id='charLooks' name='charLooks' loading={generatingPortrait} allowHtml />
        <input type='hidden' bind:this={looksInputEl} name='charLooks' />
      </div>
    </div>
    <div class='row'>
      <div class='labels'><label for='charIcon'>Portrét</label></div>
      <div class='inputs'>
        <div class='portrait'>
          <PortraitInput identity={character} {newPortraitBase64} displayHeight={200} table='characters' />
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
        <TextareaExpandable bind:this={bioTextareaEl} bind:value={character.bio} {user} id='charBio' allowHtml />
        <input type='hidden' bind:this={bioInputEl} name='charBio' />
      </div>
    </div>
    {#if isGameOwner || isStoryteller}
      <div class='row'>
        <div class='labels'><label for='storyteller'>Vypravěč</label></div>
        <div class='inputs'><input type='checkbox' id='storyteller' name='storyteller' checked={character.storyteller} /></div>
      </div>
    {/if}
    <center>
      <button type='button' onclick={submitForm} class='large' disabled={!character.name}>{#if character.id}Upravit postavu{:else}Vytvořit postavu{/if}</button>
    </center>
  </form>

  {#if isCharacterOwner}
    <details>
      <summary>Smazat postavu</summary>
      <h3>Smazání postavy</h3>
      Pozor, toto je nevratná akce.<br><br>
      <button class='delete' onclick={() => { if (confirm('Opravdu chcete smazat tuto postavu?')) { deleteCharacter() } }}>
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
