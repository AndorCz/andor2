<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { Render } from '@jill64/svelte-sanitize'
  import { showSuccess } from '@lib/toasts'
  import { updateURLParam } from '@lib/utils'
  import EditableLong from '@components/common/EditableLong.svelte'
  import CodexSection from '@components/games/codex/CodexSection.svelte'

  export let user
  export let game
  export let isStoryteller
  export let isPlayer

  let sections = [{ slug: 'general', name: 'Obecné' }]
  let activeSection = sections[0]
  let searchEl
  let searchPhrase = ''
  let searchResults = []

  onMount(() => {
    if (Array.isArray(game.codexSections)) { sections = [...sections, ...game.codexSections] }
    const section = new URLSearchParams(window.location.search).get('codex_section')
    if (section) { activeSection = sections.find((s) => { return s.slug === section }) || sections[0] }
  })

  function activate (section) {
    activeSection = section
    if (section.slug === 'general') {
      window.history.pushState({}, '', window.location.pathname)
    } else {
      updateURLParam('codex_section', section.slug)
    }
  }

  async function updateGeneral (publicChange = true) {
    const newData = { info: game.info }
    if (publicChange) { newData.info_changed_at = new Date() }
    const { error } = await supabase.from('games').update(newData).eq('id', game.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
    // seen()
  }

  async function handleSearch () {
    if (searchPhrase) {
      const { data, error } = await supabase.from('codex_pages').select('*').eq('game', game.id).ilike('content', `%${searchPhrase}%`)
      if (error) { return handleError(error) }
      searchResults = data
    }
  }

  /*
  function seen () {
    delete game.unread.gameInfo
    setRead(user.id, 'game-info-' + game.id)
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
        <!--
        <span class='search'>
          <input type='text' bind:value={searchPhrase} placeholder='Vyhledat' bind:this={searchEl} />
          <button on:click={openSearch} class='material square' title='Vyhledat' use:tooltip>search</button>
        </span>
        -->
      </div>
    {/if}
    {#if activeSection.slug === 'general'}
      <!-- single section only -->
      <EditableLong userId={user.id} bind:value={game.info} onSave={updateGeneral} canEdit={isStoryteller} allowHtml />
      <br><br>
      Správce hry: {game.owner.name}
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
            <a href={`/games/${game.slug}/codex/${page.slug}`}>{page.name}</a>
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
    <p class='info'>Informace o hře nejsou veřejné</p>
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
    margin-top: 0px;
    margin-bottom: 20px;
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

  @media (max-width: 1000px) {
    main {
      padding: 20px 0px;
    }
    .codex {
      flex-wrap: wrap;
    }
  }
</style>
