<script>
  import { onMount } from 'svelte'
  import { getStamp } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import ButtonLoading from '@components/common/ButtonLoading.svelte'
  import { supabase, handleError, getPortraitUrl, deleteStorageFolder } from '@lib/database-browser'

  let { game = $bindable(), character } = $props()

  let headlineEl = $state()
  let originalValues = $state({})
  let generatingPortrait = $state(false)
  const savingValues = $state({})

  onMount(() => {
    originalValues = { ...game }
  })

  async function onSave (field, value) {
    savingValues[field] = true
    const { error } = await supabase.from('solo_games').update({ [field]: value }).eq('id', game.id)
    if (error) {
      handleError(error)
    } else {
      originalValues[field] = value
      showSuccess('Změna byla uložena')
    }
    savingValues[field] = false
  }

  async function regeneratePortrait () {
    generatingPortrait = true
    const response = await fetch('/api/solo/generatePortrait', { method: 'POST', body: JSON.stringify({ gameId: game.id }), headers: { 'Content-Type': 'application/json' } })
    if (!response.ok) { throw new Error(`API error: ${(await response.json()).error.message || 'Chyba generování pole'}`) }
    character.portrait = getStamp()
    generatingPortrait = false
  }

  function showGame () {
    window.location.href = `/solo/game/${game.id}`
  }

  async function deleteGame () {
    const { error } = await supabase.from('solo_games').delete().eq('id', game.id)
    if (error) { return handleError(error) }
    const { error: removeError } = await supabase.storage.from('npcs').remove(game.storyteller + '.jpg')
    if (removeError) { return handleError(removeError) }
    const { error: folderError } = await deleteStorageFolder('scenes', game.id)
    if (folderError) { return handleError(folderError) }
    window.location.href = '/solo?toastType=success&toastText=' + encodeURIComponent('Hra byla smazána')
  }
</script>

<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/solo/game/{game.id}' class='backlink'>{game.name}</a>
    <h1>Nastavení</h1>
    <button onclick={showGame} class='material square back' title='Zpět na hru' use:tooltip>arrow_back</button>
  </div>
</div>

<main>
  <h2>Název</h2>
  <div class='row'>
    <input type='text' bind:value={game.name} maxlength='80' />
    <button onclick={onSave('name', game.name)} disabled={savingValues.name || (originalValues.name === game.name)} class='material save square' title='Uložit' use:tooltip>check</button>
  </div>

  <h2>Ikonka postavy</h2>
  <div>
    <p>
      {#key character.portrait}
        <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt='avatar vypravěče' />
      {/key}
    </p>
    <ButtonLoading loading={generatingPortrait} handleClick={regeneratePortrait} label='Přegenerovat' />
  </div>

  <h2>Smazání hry</h2>
  Pozor, toto je nevratná akce<br><br>
  <button class='delete' onclick={() => { if (confirm('Opravdu chcete smazat tuto hru?')) { deleteGame() } }}>
    <span class='material'>warning</span><span>Smazat hru</span>
  </button>
</main>

<style>
  .headline {
    position: sticky;
    top: -1px; /* needed for observer */
    background-color: var(--panel);
    padding-top: 10px;
    padding-bottom: 10px;
    margin: 0px -30px;
    z-index: 10;
  }
    .wrapper {
      padding: 0px 30px;
    }
      .headline .backlink {
        font-family: var(--headlineFont);
        display: inline-block;
        font-size: inherit;
      }
      .headline h1 {
        margin: 0px;
        margin-top: -5px;
        padding: 0px;
      }
      .back {
        position: absolute;
        top: 8px;
        right: 20px;
      }

  main {
    max-width: 800px;
    margin: auto;
  }

  h2 {
    margin-top: 50px;
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
    input[type=text] {
      width: 100%;
    }

  .delete {
    display: flex;
    gap: 10px;
  }

  @media (max-width: 1200px) {
    .headline {
      margin: 0px -30px;
    }
  }

  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
    .headline {
      margin: 0px -15px;
    }
  }
</style>
