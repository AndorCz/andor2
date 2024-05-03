<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { createSlug } from '@lib/utils'
  import { showSuccess, showError } from '@lib/toasts'
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
  let originalOpenGame
  let originalOpenCodex
  let originalAnnotation
  let originalContextDice
  let welcomeMessageRef
  let newCodexSection = ''
  let newFont = ''
  let isWelcomeMessageDirty = false
  let headlineEl

  onMount(() => {
    setOriginal()
    const observer = new IntersectionObserver(([e]) => e.target.classList.toggle('pinned', e.intersectionRatio < 1), { threshold: [1] })
    observer.observe(headlineEl)

    // load google fonts api
    // window.gapi.client.setApiKey('AIzaSyDj3gKPr8w-lAH97ukj5tKEQcUtVXKj1wA')
    // window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/webfonts/v1/rest')
    // window.gapi.load('client')
  })

  function setOriginal () {
    originalName = game.name
    originalSystem = game.system
    originalCategory = game.category
    originalOpenDiscussion = game.open_discussion
    originalRecruitmentOpen = game.recruitment_open
    originalAnnotation = game.annotation
    originalOpenGame = game.open_game
    originalOpenCodex = game.open_codex
    originalContextDice = game.context_dice
  }

  async function updateGame () {
    saving = true
    const welcomeMessage = await welcomeMessageRef.getContent()
    const { error } = await supabase.from('games').update({ name: game.name, annotation: game.annotation, category: game.category, system: game.system, open_discussion: game.open_discussion, open_codex: game.open_codex, recruitment_open: game.recruitment_open, context_dice: game.context_dice, welcome_message: welcomeMessage, open_game: game.open_game, fonts: game.fonts }).eq('id', game.id)
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
    game.codexSections = [...game.codexSections, { id: newSection[0].id, slug, name: newCodexSection }]
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
    const newName = window.prompt('Zadejte nový název sekce', section.name)?.trim()
    if (!newName) { return }
    const { error } = await supabase.from('codex_sections').update({ name: newName }).eq('id', section.id)
    if (error) { return handleError(error) }
    game.codexSections = game.codexSections.map((s) => { return s.slug === section.slug ? { ...s, name: newName } : s })
    showSuccess('Sekce přejmenována')
  }

  async function toggleArchived () {
    const { error } = await supabase.from('games').update({ archived: !game.archived }).eq('id', game.id)
    if (error) { return handleError(error) }
    game.archived = !game.archived
    showSuccess(game.archived ? 'Hra byla archivována' : 'Hra byla aktivována')
  }

  function showGame () {
    window.location.href = `/game/${game.id}`
  }

  function exportGame () {
    window.location.href = '/api/game/download?game=' + game.id
  }

  async function addFont () {
    // check if the font exists in google fonts
    const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyDj3gKPr8w-lAH97ukj5tKEQcUtVXKj1wA&family=${newFont}`)
    const data = await response.json()
    if (data.error) { return showError('Font nenalezen') }
    // add to the game
    game.fonts = game.fonts || []
    game.fonts = [...game.fonts, newFont]
    await updateGame()
    newFont = ''
  }

  async function removeFont (font) {
    game.fonts = game.fonts.filter((f) => { return f !== font })
    await updateGame()
  }
</script>

<!--
<svelte:head>
  <script src='https://apis.google.com/js/api.js'></script>
</svelte:head>
-->
<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/game/{game.id}' class='backlink'>{game.name}</a>
    <h1>Nastavení</h1>
    <button on:click={showGame} class='material square back' title='Zpět do hry' use:tooltip>check</button>
  </div>
</div>
<main>
  {#if game.owner.id === user.id}
    {#if !game.archived}
      <h2 class='first'>Vlastní hlavička</h2>
      Obrázek musí mít velikost alespoň 1100×226 px<br><br>
      <div class='row'>
        <label class='button' for='headerImage'>Nahrát obrázek</label>
        <HeaderInput data={game} section='games' unit='game' />
      </div>

      <h2>Název</h2>
      <div class='row'>
        <input type='text' id='gameName' name='gameName' bind:value={game.name} maxlength='80' />
        <button on:click={updateGame} disabled={saving || (originalName === game.name)} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Anotace</h2>
      <div class='row'>
        <TextareaExpandable userId={user.id} id='gameAnnotation' name='gameAnnotation' bind:value={game.annotation} maxlength={150} />
        <button on:click={updateGame} disabled={saving || originalAnnotation === game.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Uvítací zpráva <span class='material' title={'Příjde novým hráčům, od vypravěče který je přijal do hry'} use:tooltip>info</span></h2>
      <div class='row'>
        <TextareaExpandable bind:this={welcomeMessageRef} userId={user.id} id='gameWelcomeMessage' name='gameWelcomeMessage' value={game.welcome_message} maxlength={150} allowHtml onTyping={() => { isWelcomeMessageDirty = true }} />
        <button on:click={updateGame} disabled={saving || !isWelcomeMessageDirty} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Kategorie</h2>
      <div class='row'>
        <select id='gameCategory' name='gameCategory' bind:value={game.category}>
          {#each gameCategories as category}
            <option value={category.value}>{category.label}</option>
          {/each}
        </select>
        <button on:click={updateGame} disabled={saving || (originalCategory === game.category)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Herní systém</h2>
      <div class='row'>
        <select id='gameSystem' name='gameSystem' bind:value={game.system}>
          {#each gameSystems as system}
            <option value={system.value}>{system.label}</option>
          {/each}
        </select>
        <button on:click={updateGame} disabled={saving || (originalSystem === game.system)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Nábor</h2>
      <div class='row'>
        <select id='gameRecruitmentOpen' name='gameRecruitmentOpen' bind:value={game.recruitment_open}>
          <option value={false}>Uzavřený</option>
          <option value={true}>Otevřený</option>
        </select>
        <button on:click={updateGame} disabled={saving || (originalRecruitmentOpen === game.recruitment_open)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Viditelnost hry <span class='material' title='Skryje herní příspěvky, postavy a mapy' use:tooltip>info</span></h2>
      <div class='row'>
        <select id='gameOpen' name='gameOpen' bind:value={game.open_game}>
          <option value={true}>Veřejná</option>
          <option value={false}>Soukromá</option>
        </select>
        <button on:click={updateGame} disabled={saving || (originalOpenGame === game.open_game)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Viditelnost diskuze</h2>
      <div class='row'>
        <select id='gameOpenDiscussion' name='gameOpenDiscussion' bind:value={game.open_discussion}>
          <option value={false}>Soukromá</option>
          <option value={true}>Veřejná</option>
        </select>
        <button on:click={updateGame} disabled={saving || (originalOpenDiscussion === game.open_discussion)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Viditelnost kodexu</h2>
      <div class='row'>
        <select id='gameOpenCodex' name='gameOpenCodex' bind:value={game.open_codex}>
          <option value={true}>Veřejný</option>
          <option value={false}>Soukromý</option>
        </select>
        <button on:click={updateGame} disabled={saving || (originalOpenCodex === game.open_codex)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Sekce kodexu</h2>
      {#if game.codexSections && game.codexSections.length}
        <ul>
          {#each game.codexSections as section}
            <li>
              <div class='section'>
                <h3>{section.name}</h3>
                <button class='square material square' on:click={() => { renameCodexSection(section) }} title='Přejmenovat sekci' use:tooltip>edit</button>
                <button class='square material square' on:click={() => { deleteCodexSection(section) }} title='Smazat sekci' use:tooltip>delete</button>
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
        <button class='material square' on:click={addCodexSection} disabled={saving || newCodexSection.trim() === ''} title='Přidat sekci' use:tooltip>add</button>
      </div>

      <h2>Zobrazit hody mezi příspěvky</h2>
      <div class='row'>
        <input type='checkbox' id='contextDice' name='contextDice' bind:checked={game.context_dice} />
        <button on:click={updateGame} disabled={saving || (originalContextDice === game.context_dice)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>
    {/if}

    <h2>Fonty <span class='material' title='Umožní další fonty z Google Fonts. Pozor, každý font navíc o něco zpomalý načítání hry všem hráčům' use:tooltip>info</span></h2>
    {#if game.fonts && game.fonts.length}
      <ul>
        {#each game.fonts as font}
          <li>
            <div class='font'>
              <h3>{font}</h3>
              <button class='square material square' on:click={() => { removeFont(font) }} title='Odebrat font' use:tooltip>delete</button>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class='info'>Žádné fonty navíc</p>
    {/if}
    <h3><label for='gameFont'>Nový font</label></h3>
    <div class='row'>
      <input type='text' id='gameFont' name='gameFont' size='40' bind:value={newFont} />
      <button class='material square' on:click={addFont} disabled={saving || newFont.trim() === ''} title='Přidat font' use:tooltip>add</button>
    </div>

    <h2>Záloha do souboru</h2>
    <button class='export' on:click={exportGame}>
      <span class='material'>download</span><span>Stáhnout zálohu</span>
    </button>

    {#if game.archived}
      <h2>Obnova hry</h2>
      <button class='archive' on:click={() => { if (confirm('Opravdu chcete tuto hru vrátit z archivu?')) { toggleArchived() } }}>
        <span class='material'>unarchive</span><span>Znovu aktivovat</span>
      </button>
    {:else}
      <h2>Archivace hry <span class='material' title='Hra bude jen pro čtení, lze vrátit' use:tooltip>info</span></h2>
      <button class='archive' on:click={() => { if (confirm('Opravdu chcete tuto archivovat?')) { toggleArchived() } }}>
        <span class='material'>archive</span><span>Archivovat hru</span>
      </button>
    {/if}

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
    position: sticky;
    top: -1px; /* needed for observer */
    background-color: var(--panel);
    padding-top: 10px;
    padding-bottom: 10px;
    margin: 0px -60px;
    z-index: 10;
  }
    .wrapper {
      max-width: 600px;
      margin: auto;
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
    max-width: 600px;
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
    input[type=text], select {
      width: 100%;
    }
    .section, .font {
      display: flex;
      align-items: center;
      gap: 20px;
    }
      .section h3, .font h3 {
        width: 100%;
      }
  .delete, .export, .archive {
    display: flex;
    gap: 10px;
  }

  ul {
    padding: 0px;
  }
    li {
      padding: 10px 20px;
      margin-bottom: 1px;
      list-style-type: none;
      background: var(--block);
    }
      ul h3 {
        margin: 10px 0px;
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
