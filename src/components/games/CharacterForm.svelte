<script>
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let isGameOwner
  export let userId
  export let character = {}

  let generatingPortrait = false

  const generatePortrait = async () => {
    try {
      generatingPortrait = true
      const response = await fetch('/api/game/generatePortrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearance: character.appearance, userId })
      })
      const generated = await response.json()
      console.log('data', generated.data[0].url)
      character.portrait = generated.data[0].url
      generatingPortrait = false
    } catch (error) { window.showError('Chyba v generování portrétu') }
  }
</script>

{#if userId}
  <form method='POST' autocomplete='off'>
    <table>
      <tr>
        <td class='labels'><label for='charName'>Jméno</label></td>
        <td class='inputs'><input type='text' id='charName' name='charName' maxlength='100' bind:value={character.name} /></td>
      </tr>
      <tr>
        <td class='labels'><label for='charLooks'>Vzhled</label></td>
        <td class='inputs'><TextareaExpandable id='charLooks' name='charLooks' bind:value={character.appearance} /></td>
      </tr>
      <tr>
        <td class='labels'><label for='charIcon'>Portrét</label></td>
        <td class='inputs'>
          <div class='portrait'>
            <PortraitInput identity={character} />
            <span>
              <button id='generatePortrait' type='button' on:click={generatePortrait} disabled={generatingPortrait || !character.appearance || character.appearance?.length < 20}>Vygenerovat portrét</button>Dle popisu vzhledu
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td class='labels'><label for='charBio'>Životopis</label></td>
        <td class='inputs'><TextareaExpandable id='charBio' name='charBio' bind:value={character.bio} /></td>
      </tr>
      {#if isGameOwner}
        <tr>
          <td class='labels'><label for='storyteller'>Vypravěč</label></td>
          <td class='inputs'><input type='checkbox' id='storyteller' name='storyteller' checked={character.storyteller} /></td>
        </tr>
      {/if}
    </table>
    <center>
      <button type='submit'>{#if character.id}Upravit postavu{:else}Vytvořit postavu{/if}</button>
    </center>
  </form>
{:else}
  <div>
    <p>Pro vytvoření nové postavy se musíš přihlásit.</p>
  </div>
{/if}

<style>
  form, form table {
    width: 100%;
  }
    textarea {
      width: 100%;
    }
    td {
      padding: 10px 0px;
    }

    .labels {
      width: 20%;
      padding-right: 10px;
    }
    .portrait {
      display: flex;
      gap: 20px;
    }

    #charName {
      width: 400px;
    }
      #charBio {
        min-height: 200px;
      }
    #generatePortrait {
      margin-right: 20px;
    }
  center {
    margin-top: 20px;
  }
</style>