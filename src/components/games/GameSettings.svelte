<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { createSlug } from '@lib/utils'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database'
  import { gameSystems, gameCategories } from '@lib/constants'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import HeaderInput from '@components/common/HeaderInput.svelte'

  export let game = {}
  export let user = {}

  let saving = false
  let originalSystem
  let originalName
  let originalCategory
  let originalOpenDiscussion
  let originalRecruitmentOpen
  let originalOpenCodex
  let originalAnnotation
  let originalContextDice
  let welcomeMessageRef
  let newCodexSection = ''
  let isWelcomeMessageDirty = false

  onMount(setOriginal)

  function setOriginal () {
    originalName = game.name
    originalSystem = game.system
    originalCategory = game.category
    originalOpenDiscussion = game.open_discussion
    originalRecruitmentOpen = game.recruitment_open
    originalAnnotation = game.annotation
    originalOpenCodex = game.open_codex
    originalContextDice = game.context_dice
  }

  async function updateGame () {
    saving = true
    const welcomeMessage = await welcomeMessageRef.getContent()
    const { error } = await supabase.from('games').update({ name: game.name, annotation: game.annotation, category: game.category, system: game.system, open_discussion: game.open_discussion, open_codex: game.open_codex, recruitment_open: game.recruitment_open, context_dice: game.context_dice, welcome_message: welcomeMessage }).eq('id', game.id)
    if (error) { return handleError(error) }
    setOriginal()
    // update AI storyteller if system changed
    /*
    if (originalSystem !== game.system) {
      const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: game.owner.id, system: game.system, storyteller: game.openai_storyteller, annotation: game.annotation, prompt: game.prompt }), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
    }
    */
    showSuccess('Změna hry uložena')
    saving = false
    // await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
  }

  async function deleteGame () {
    const { error } = await supabase.from('games').delete().eq('id', game.id)
    if (error) { return handleError(error) }
    // await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
    window.location.href = '/games?toastType=success&toastText=' + encodeURIComponent('Hra byla smazána')
  }

  async function addCodexSection () {
    const slug = createSlug(newCodexSection)
    const index = game.codexSections ? game.codexSections.length + 1 : 1
    const { data: newSection, error } = await supabase.from('codex_sections').insert({ slug, game: game.id, name: newCodexSection, index }).select()
    if (error) { return handleError(error) }
    game.codexSections = game.codexSections || []
    game.codexSections.push({ id: newSection.id, slug, name: newCodexSection })
    newCodexSection = ''
    showSuccess('Sekce přidána do kodexu')
  }

  async function deleteCodexSection (section) {
    if (!confirm('Opravdu chcete smazat tuto sekci? Tato akce smaže i celý její obsah a je nevratná.')) { return }
    const { error } = await supabase.from('codex_sections').delete().eq('id', section.id)
    if (error) { return handleError(error) }
    game.codexSections = game.codexSections.filter((s) => { return s.slug !== section.slug })
    showSuccess('Sekce smazána')
  }

  async function renameCodexSection (section) {
    const newName = window.prompt('Zadejte nový název sekce', section.name).trim()
    if (!newName) { return }
    const { error } = await supabase.from('codex_sections').update({ name: newName }).eq('id', section.id)
    if (error) { return handleError(error) }
    game.codexSections = game.codexSections.map((s) => { return s.slug === section.slug ? { ...s, name: newName } : s })
    showSuccess('Sekce přejmenována')
  }

  function showGame () {
    window.location.href = `/game/${game.id}`
  }

  function exportGame () {
    window.location.href = '/api/game/download?game=' + game.id
  }
</script>

<main>
  <div class='headline'>
    <h1>Nastavení hry "{game.name}"</h1>
    <button on:click={showGame} class='material square' title='Zpět do hry'>check</button>
  </div>

  {#if game.owner.id === user.id}
    <h2 class='first'>Vlastní hlavička</h2>
    Obrázek musí mít velikost alespoň 1100×226 px<br><br>
    <div class='row'>
      <label class='button' for='headerImage'>Nahrát obrázek</label>
      <HeaderInput data={game} section='games' unit='game' />
    </div>

    <h2>Název</h2>
    <div class='row'>
      <input type='text' id='gameName' name='gameName' bind:value={game.name} maxlength='80' />
      <button on:click={updateGame} disabled={saving || (originalName === game.name)} class='material'>check</button>
    </div>

    <h2>Anotace</h2>
    <div class='row'>
      <TextareaExpandable userId={user.id} id='gameAnnotation' name='gameAnnotation' bind:value={game.annotation} maxlength={150} />
      <button on:click={updateGame} disabled={saving || originalAnnotation === game.annotation} class='material save'>check</button>
    </div>

    <h2>Uvítací zpráva <span class='material' title={'Příjde novým hráčům, od vypravěče který je přijal do hry'} use:tooltip>info</span></h2>
    <div class='row'>
      <TextareaExpandable bind:this={welcomeMessageRef} userId={user.id} id='gameWelcomeMessage' name='gameWelcomeMessage' value={game.welcome_message} maxlength={150} allowHtml onTyping={() => { isWelcomeMessageDirty = true }} />
      <button on:click={updateGame} disabled={saving || !isWelcomeMessageDirty} class='material save'>check</button>
    </div>

    <h2>Kategorie</h2>
    <div class='row'>
      <select id='gameCategory' name='gameCategory' bind:value={game.category}>
        {#each gameCategories as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || (originalCategory === game.category)} class='material'>check</button>
    </div>

    <h2>Herní systém</h2>
    <div class='row'>
      <select id='gameSystem' name='gameSystem' bind:value={game.system}>
        {#each gameSystems as system}
          <option value={system.value}>{system.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || (originalSystem === game.system)} class='material'>check</button>
    </div>

    <h2>Nábor</h2>
    <div class='row'>
      <select id='gameRecruitmentOpen' name='gameRecruitmentOpen' bind:value={game.recruitment_open}>
        <option value={false}>Uzavřený</option>
        <option value={true}>Otevřený</option>
      </select>
      <button on:click={updateGame} disabled={saving || (originalRecruitmentOpen === game.recruitment_open)} class='material'>check</button>
    </div>

    <h2>Viditelnost diskuze</h2>
    <div class='row'>
      <select id='gameOpenDiscussion' name='gameOpenDiscussion' bind:value={game.open_discussion}>
        <option value={false}>Soukromá</option>
        <option value={true}>Veřejná</option>
      </select>
      <button on:click={updateGame} disabled={saving || (originalOpenDiscussion === game.open_discussion)} class='material'>check</button>
    </div>

    <h2>Viditelnost kodexu</h2>
    <div class='row'>
      <select id='gameOpenCodex' name='gameOpenCodex' bind:value={game.open_codex}>
        <option value={true}>Veřejný</option>
        <option value={false}>Soukromý</option>
      </select>
      <button on:click={updateGame} disabled={saving || (originalOpenCodex === game.open_codex)} class='material'>check</button>
    </div>

    <h2>Sekce kodexu</h2>
    {#if game.codexSections && game.codexSections.length}
      <ul>
        {#each game.codexSections as section}
          <li>
            <div class='section'>
              <h3>{section.name}</h3>
              <button class='square material' on:click={() => { renameCodexSection(section) }} title='přejmenovat'>edit</button>
              <button class='square material' on:click={() => { deleteCodexSection(section) }} title='smazat'>delete</button>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class='info'>Žádné sekce</p>
    {/if}
    <h3><label for='codexSection'>Nová sekce</label></h3>
    <div class='row'>
      <input type='text' id='codexSection' name='codexSection' size='40' bind:value={newCodexSection} />
      <button class='material' on:click={addCodexSection} disabled={saving || newCodexSection.trim() === ''}>add</button>
    </div>

    <h2>Zobrazit hody mezi příspěvky</h2>
    <div class='row'>
      <input type='checkbox' id='contextDice' name='contextDice' bind:checked={game.context_dice} />
      <button on:click={updateGame} disabled={saving || (originalContextDice === game.context_dice)} class='material'>check</button>
    </div>

    <h2>Záloha do souboru</h2>
    <button class='export' on:click={exportGame}>
      <span class='material'>download</span><span>Stáhnout zálohu</span>
    </button>

    <h2>Smazání hry</h2>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto hru?')) { deleteGame() } }}>
      <span class='material'>warning</span><span>Smazat hru</span>
    </button>
  {:else}
    Tato sekce je jen pro vlastníka hry.
  {/if}
</main>

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
    h1 {
      margin: 0px;
    }
    .headline button {
      margin-left: 10px;
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
    #gameName {
      width: 100%;
    }
    select {
      width: 100%;
      max-width: 400px;
    }
    .section {
      display: flex;
      align-items: center;
      gap: 20px;
    }
      .section h3 {
        min-width: 300px;
      }
  .delete, .export {
    display: flex;
    gap: 10px;
  }

  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
  }
</style>
