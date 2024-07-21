<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { supabase, handleError } from '@lib/database-browser'
  import { Render } from '@jill64/svelte-sanitize'
  import { showSuccess } from '@lib/toasts'
  import { updateURLParam } from '@lib/utils'
  import { getPortraitUrl } from '@lib/database-browser'
  import EditableLong from '@components/common/EditableLong.svelte'
  import CodexSection from '@components/games/codex/CodexSection.svelte'

  export let user
  export let game
  export let isStoryteller
  export let isPlayer

  let sections = [{ slug: 'index', name: 'Úvod' }]
  let activeSection = sections[0]
  let indexPageContent
  let searchEl
  let searchPhrase = ''
  let searchResults = []

  const mentionList = writable([])
  $mentionList = game.characters.filter((char) => { return char.accepted && char.state === 'alive' }).map((char) => { return { name: char.name, id: char.id } })

  onMount(() => {
    if (Array.isArray(game.codexSections)) { sections = [...sections, ...game.codexSections] }
    const section = new URLSearchParams(window.location.search).get('codex_section')
    if (section) { activeSection = sections.find((s) => { return s.slug === section }) || sections[0] }
  })

  async function loadIndex () {
    const { data, error } = await supabase.from('codex_pages').select('content').match({ game: game.id, slug: 'index' }).single()
    if (error) { return handleError(error) }
    indexPageContent = data.content
  }

  async function updateIndex () {
    const { error } = await supabase.from('codex_pages').update({ content: indexPageContent }).match({ game: game.id, slug: 'index' })
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }

  function activate (section) {
    activeSection = section
    if (section.slug === 'index') {
      window.history.pushState({}, '', window.location.pathname)
    } else {
      updateURLParam('codex_section', section.slug)
    }
  }

  async function handleSearch () {
    searchResults = []
    if (searchPhrase) {
      // search the index page
      if (indexPageContent.toLowerCase().includes(searchPhrase.toLowerCase())) {
        searchResults = [{ name: 'Úvod', content: indexPageContent }]
      }
      // search codex_sections.content
      const { data: sections, error: sectionError } = await supabase.from('codex_sections').select('*').eq('game', game.id).ilike('content', `%${searchPhrase}%`)
      if (sectionError) { return handleError(sectionError) }
      if (sections) { // move section slug to section object
        sections.forEach((section) => {
          section.section = { slug: section.slug }
          delete section.slug
        })
        searchResults = [...searchResults, ...sections]
      }
      // search codex_pages
      const { data: pages, error: pageError } = await supabase.from('codex_pages').select('id, name, content, section(slug), slug').eq('game', game.id).ilike('content', `%${searchPhrase}%`)
      if (pageError) { return handleError(pageError) }
      if (pages) { searchResults = [...searchResults, ...pages] }
    }
  }

  /*
  function seen () {
    delete game.unread.gameCodex
    setRead(user.id, 'game-codex-' + game.id)
    const game = $bookmarks.games.find((game) => { return game.id === game.id })
    if (game) { game.unread = 0 }
    $bookmarks = $bookmarks
  }
  */

  // $: if ($bookmarks.games.length) { seen() }
</script>

<main>
  {#if game.open_codex || isPlayer}
    {#if sections.length > 1}
      <div class='row'>
        <div class='tabs tertiary codex'>
          {#each sections as section}
            <button class='section' on:click={() => { activate(section) }} class:active={activeSection.slug === section.slug}>
              {section.name}
            </button>
          {/each}
          <button on:click={() => { activeSection = { slug: 'search' } }} class='search section' class:active={activeSection.slug === 'search'}><span class='material'>search</span>Hledat</button>
        </div>
      </div>
    {/if}
    {#if activeSection.slug === 'index'}
      {#await loadIndex()}
        Načítám úvod
      {:then}<!-- single section only -->
        <EditableLong fonts={game.fonts} {user} bind:value={indexPageContent} placeholder='Úvodní stránka kodexu. Informace pro hráče o pravidlech, světě, postavách, příběhu apod. Více sekcí a stránek lze přidat v nastavení.' onSave={updateIndex} canEdit={isStoryteller} {mentionList} allowHtml />
      {/await}
      <br><br>
      <div class='row details'>
        <span>Správce hry:</span>
        <a href='/user?id={game.owner.id}' class='user owner'>
          <span>{game.owner.name}</span>
          {#if game.owner.portrait}<img src={getPortraitUrl(game.owner.id, game.owner.portrait)} class='icon' alt={game.owner.name} />{/if}
        </a>
      </div>
    {:else if activeSection.slug === 'search'}
      <!-- search -->
      <div class='searchBox'>
        <!-- svelte-ignore a11y-autofocus -->
        <input type='text' size='30' placeholder='vyhledat' autofocus bind:value={searchPhrase} bind:this={searchEl} on:keydown={(e) => { if (e.key === 'Enter') { handleSearch() } }} />
        <button class='material' on:click={handleSearch}>search</button>
      </div>
      {#if searchResults.length}
        {#each searchResults as page}
          <div class='page'>
            <a href={`/game/${game.id}?codex_section=${page.section?.slug || ''}&codex_page=${page.slug || ''}`}>{page.name}</a>
            <Render html={page.content} />
          </div>
        {/each}
      {:else}
        <p class='info'>Žádné výsledky</p>
      {/if}
    {:else}
      <CodexSection {user} {game} {activeSection} {isStoryteller} />
    {/if}
  {:else}
    <div class='info'><span class='material'>info</span>Kodex této hry není veřejný</div>      <br><br>
    <div class='row details'>
      <span>Správce hry:</span>
      <a href='/user?id={game.owner.id}' class='user owner'>
        <span>{game.owner.name}</span>
        {#if game.owner.portrait}<img src={getPortraitUrl(game.owner.id, game.owner.portrait)} class='icon' alt={game.owner.name} />{/if}
      </a>
    </div>

  {/if}
</main>

<style>
  main {
    padding: 40px 0px;
  }
  .row {
    display: flex;
    align-items: baseline;
  }
  .codex {
    display: flex;
    justify-content: center;
    flex: 1;
    flex-wrap: wrap;
    margin-top: 0px;
    margin-bottom: 20px;
  }
    .codex button {
      text-shadow: none;
    }
    .section {
      display: inline-flex;
      gap: 10px;
      align-items: center;
    }
    .section.active {
      color: var(--text);
    }
    .search {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .searchBox {
      margin: auto;
      display: flex;
      width: fit-content;
      gap: 10px;
      padding: 20px;
    }
    .page {
      background-color: var(--block);
      padding: 20px;
      margin-bottom: 20px;
    }
  .info {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .details {
    gap: 20px;
  }
  .owner {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
    .icon {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: cover;
      object-position: center 20%;
      border-radius: 100%;
      background-color: var(--background);
    }

  @media (max-width: 1000px) {
    main {
      padding: 20px 0px;
    }
    .codex {
      flex-wrap: wrap;
    }
  }
</style>
