<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { createSlug } from '@lib/utils'
  import { supabase, handleError } from '@lib/database-browser'
  import { showSuccess, showError } from '@lib/toasts'
  import { gameSystems, gameCategories } from '@lib/constants'
  import Sortable from 'sortablejs'
  import HeaderInput from '@components/common/HeaderInput.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  let { game = $bindable({}), user = {} } = $props()

  let saving = $state(false)
  let originalSystem = $state()
  let originalName = $state()
  let originalCategory = $state()
  let originalOpenDiscussion = $state()
  let originalOpenChars = $state()
  let originalRecruitmentOpen = $state()
  let originalOpenGame = $state()
  let originalOpenCodex = $state()
  let originalAnnotation = $state()
  let originalContextDice = $state()
  let welcomeMessageRef = $state()
  let newCodexSection = $state('')
  let newFont = $state('')
  let isWelcomeMessageDirty = $state(false)
  let headlineEl = $state()
  let sectionListEl = $state(null)
  let initialized = $state(false)
  let isSortable = $state(false)
  let sectionSaving = $state(false)
  let sortableInstance = $state(null)
  let sortKey = $state(0)

  function sortSections (sections) {
    return [...sections].sort((a, b) => (a.index ?? 0) - (b.index ?? 0) || a.name.localeCompare(b.name))
  }

  const codexSections = $derived(Array.isArray(game.codexSections) ? sortSections(game.codexSections) : [])

  onMount(() => {
    setOriginal()
    const observer = new IntersectionObserver(([e]) => e.target.classList.toggle('pinned', e.intersectionRatio < 1), { threshold: [1] })
    observer.observe(headlineEl)
  })

  $effect(() => {
    if (!initialized && sectionListEl && codexSections.length && !isSortable) {
      sortableInstance = new Sortable(sectionListEl, {
        animation: 150,
        handle: '.handle',
        dataIdAttr: 'data-id',
        onEnd
      })
      isSortable = true
      initialized = true
    }
  })

  function setOriginal () {
    originalName = game.name
    originalSystem = game.system
    originalCategory = game.category
    originalOpenDiscussion = game.open_discussion
    originalOpenChars = game.open_chars
    originalRecruitmentOpen = game.recruitment_open
    originalAnnotation = game.annotation
    originalOpenGame = game.open_game
    originalOpenCodex = game.open_codex
    originalContextDice = game.context_dice
  }

  async function updateGame () {
    saving = true
    const welcomeMessage = await welcomeMessageRef.getContent()
    const { error } = await supabase.from('games').update({ name: game.name, annotation: game.annotation, category: game.category, system: game.system, open_discussion: game.open_discussion, open_chars: game.open_chars, open_codex: game.open_codex, recruitment_open: game.recruitment_open, context_dice: game.context_dice, welcome_message: welcomeMessage, open_game: game.open_game, fonts: game.fonts }).eq('id', game.id)
    if (error) { return handleError(error) }
    setOriginal()
    showSuccess('Změna hry uložena')
    saving = false
  }

  async function deleteGame () {
    const { error } = await supabase.from('games').delete().eq('id', game.id)
    if (error) { return handleError(error) }
    window.location.href = '/games?toastType=success&toastText=' + encodeURIComponent('Hra byla smazána')
  }

  async function addCodexSection () {
    const slug = createSlug(newCodexSection)
    const index = codexSections ? codexSections.length : 0
    const { data: newSection, error } = await supabase.from('codex_sections').insert({ slug, game: game.id, name: newCodexSection, index }).select()
    if (error) { return handleError(error) }
    game.codexSections = game.codexSections || []
    game.codexSections = [...game.codexSections, newSection[0]]
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
    const name = window.prompt('Zadejte nový název sekce', section.name)?.trim()
    if (!name) { return }
    const slug = createSlug(name)
    const { error } = await supabase.from('codex_sections').update({ name, slug }).eq('id', section.id)
    if (error) { return handleError(error) }
    game.codexSections = game.codexSections.map((s) => { return s.slug === section.slug ? { ...s, name, slug } : s })
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

  async function onEnd (sort) {
    if (sort.oldIndex === sort.newIndex) { return }
    sectionSaving = true

    // Get the order from DOM before Svelte re-renders
    const orderedIds = Array.from(sort.from.children).map((child) => child.dataset.id)

    // Build reordered array with new indices
    const currentSections = $state.snapshot(game.codexSections)
    const reordered = orderedIds
      .map((id, index) => {
        const currentSection = currentSections.find((s) => `${s.id}` === id)
        if (!currentSection) { return null }
        return { ...currentSection, index }
      })
      .filter(Boolean)

    // Destroy sortable before updating state
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
      isSortable = false
      initialized = false
    }

    await Promise.all(reordered.map((section) => updateSectionIndex(section.id, section.index)))
    if (reordered.length) {
      game.codexSections = reordered
    }

    // Force re-render with new key
    sortKey++
    sectionSaving = false
    showSuccess('Pořadí sekcí uloženo')
  }

  async function updateSectionIndex (sectionId, newIndex) {
    const { error } = await supabase.from('codex_sections').update({ index: newIndex }).eq('id', sectionId)
    if (error) { handleError(error) }
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

<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/game/{game.id}' class='backlink'>{game.name}</a>
    <h1>Nastavení</h1>
    <button onclick={showGame} class='material square back' title='Zpět do hry' use:tooltip>arrow_back</button>
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
        <button onclick={updateGame} disabled={saving || (originalName === game.name)} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Anotace</h2>
      <div class='row'>
        <TextareaExpandable {user} id='gameAnnotation' name='gameAnnotation' bind:value={game.annotation} maxlength={150} />
        <button onclick={updateGame} disabled={saving || originalAnnotation === game.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Uvítací zpráva <span class='material' title='Příjde novým hráčům, od vypravěče který je přijal do hry' use:tooltip>info</span></h2>
      <div class='row'>
        <TextareaExpandable bind:this={welcomeMessageRef} {user} id='gameWelcomeMessage' name='gameWelcomeMessage' value={game.welcome_message} maxlength={150} allowHtml onTyping={() => { isWelcomeMessageDirty = true }} />
        <button onclick={updateGame} disabled={saving || !isWelcomeMessageDirty} class='material save square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Kategorie</h2>
      <div class='row'>
        <select id='gameCategory' name='gameCategory' bind:value={game.category}>
          {#each gameCategories as category (category.value)}
            <option value={category.value}>{category.label}</option>
          {/each}
        </select>
        <button onclick={updateGame} disabled={saving || (originalCategory === game.category)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Herní systém</h2>
      <div class='row'>
        <select id='gameSystem' name='gameSystem' bind:value={game.system}>
          {#each gameSystems as system (system.value)}
            <option value={system.value}>{system.label}</option>
          {/each}
        </select>
        <button onclick={updateGame} disabled={saving || (originalSystem === game.system)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Nábor</h2>
      <div class='row'>
        <select id='gameRecruitmentOpen' name='gameRecruitmentOpen' bind:value={game.recruitment_open}>
          <option value={false}>Uzavřený</option>
          <option value={true}>Otevřený</option>
        </select>
        <button onclick={updateGame} disabled={saving || (originalRecruitmentOpen === game.recruitment_open)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Viditelnost hry <span class='material' title='Skryje herní příspěvky, postavy a mapy' use:tooltip>info</span></h2>
      <div class='row'>
        <select id='gameOpen' name='gameOpen' bind:value={game.open_game}>
          <option value={true}>Veřejná</option>
          <option value={false}>Soukromá</option>
        </select>
        <button onclick={updateGame} disabled={saving || (originalOpenGame === game.open_game)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Viditelnost diskuze</h2>
      <div class='row'>
        <select id='gameOpenDiscussion' name='gameOpenDiscussion' bind:value={game.open_discussion}>
          <option value={false}>Soukromá</option>
          <option value={true}>Veřejná</option>
        </select>
        <button onclick={updateGame} disabled={saving || (originalOpenDiscussion === game.open_discussion)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Viditelnost postav</h2>
      <div class='row'>
        <select id='gameOpenChars' name='gameOpenChars' bind:value={game.open_chars}>
          <option value={false}>Soukromá</option>
          <option value={true}>Veřejná</option>
        </select>
        <button onclick={updateGame} disabled={saving || (originalOpenChars === game.open_chars)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Viditelnost kodexu</h2>
      <div class='row'>
        <select id='gameOpenCodex' name='gameOpenCodex' bind:value={game.open_codex}>
          <option value={true}>Veřejný</option>
          <option value={false}>Soukromý</option>
        </select>
        <button onclick={updateGame} disabled={saving || (originalOpenCodex === game.open_codex)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>

      <h2>Sekce kodexu</h2>
      {#if codexSections && codexSections.length}
        {#key sortKey}
          <ul bind:this={sectionListEl} class:saving={sectionSaving}>
            {#each codexSections as section (section.id)}
              <li data-id={section.id}>
                <div class='section'>
                  <svg class='handle' width='20px' height='20px' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'>
                    <circle cx='12.5' cy='5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='12.5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='20' r='2.5' fill='currentColor'/>
                  </svg>
                  <h3>{section.name}</h3>
                  <button class='square material square' onclick={() => { renameCodexSection(section) }} title='Přejmenovat sekci' use:tooltip>edit</button>
                  <button class='square material square' onclick={() => { deleteCodexSection(section) }} title='Smazat sekci' use:tooltip>delete</button>
                </div>
              </li>
            {/each}
          </ul>
        {/key}
      {:else}
        <p class='info'>Žádné sekce</p>
      {/if}
      <div class='row operations'>
        <div class='row newSection'>
          <input type='text' id='codexSection' name='codexSection' size='40' bind:value={newCodexSection} placeholder='Nová sekce' />
          <button class='material square' onclick={addCodexSection} disabled={saving || newCodexSection.trim() === ''} title='Přidat sekci' use:tooltip>add</button>
        </div>
      </div>

      <h2>Zobrazit hody mezi příspěvky</h2>
      <div class='row'>
        <input type='checkbox' id='contextDice' name='contextDice' bind:checked={game.context_dice} />
        <button onclick={updateGame} disabled={saving || (originalContextDice === game.context_dice)} class='material square' title='Uložit' use:tooltip>check</button>
      </div>
    {/if}

    <h2>Fonty <span class='material' title='Umožní další fonty z Google Fonts. Pozor, každý font navíc o něco zpomalí načítání hry všem hráčům' use:tooltip>info</span></h2>
    {#if game.fonts && game.fonts.length}
      <ul>
        {#each game.fonts as font (font)}
          <li>
            <div class='font'>
              <h3>{font}</h3>
              <button class='square material square' onclick={() => { removeFont(font) }} title='Odebrat font' use:tooltip>delete</button>
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
      <button class='material square' onclick={addFont} disabled={saving || newFont.trim() === ''} title='Přidat font' use:tooltip>add</button>
    </div>

    <h2>Záloha do souboru</h2>
    <button class='export' onclick={exportGame}>
      <span class='material'>download</span><span>Stáhnout zálohu</span>
    </button>

    {#if game.archived}
      <h2>Obnova hry</h2>
      <button class='archive' onclick={() => { if (confirm('Opravdu chcete tuto hru vrátit z archivu?')) { toggleArchived() } }}>
        <span class='material'>unarchive</span><span>Znovu aktivovat</span>
      </button>
    {:else}
      <h2>Archivace hry <span class='material' title='Hra bude jen pro čtení, lze vrátit' use:tooltip>info</span></h2>
      <button class='archive' onclick={() => { if (confirm('Opravdu chcete tuto archivovat?')) { toggleArchived() } }}>
        <span class='material'>archive</span><span>Archivovat hru</span>
      </button>
    {/if}

    <h2>Smazání hry</h2>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' onclick={() => { if (confirm('Opravdu chcete smazat tuto hru?')) { deleteGame() } }}>
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
    margin: 0px -30px;
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
      gap: 12px;
    }
      .section h3, .font h3 {
        width: 100%;
      }
      .handle {
        display: block;
        color: var(--text);
        opacity: 0.3;
        min-width: 10px;
        width: 14px;
        height: 20px;
        cursor: grab;
        transform: scale(2);
        transform-origin: center;
      }
        .handle:hover {
          opacity: 1;
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
      margin-bottom: 2px;
      list-style-type: none;
      background: var(--block);
    }
      ul h3 {
        margin: 10px 0px;
      }

  .operations {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
    .operations .newSection {
      flex: 1;
    }
  ul.saving {
    opacity: 0.5;
    pointer-events: none;
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
  @media (max-width: 500px) {
    .headline {
      margin-top: 10px;
      padding: 0px;
      padding-left: 20px;
      padding-bottom: 20px;
    }
  }
</style>
