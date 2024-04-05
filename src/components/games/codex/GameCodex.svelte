<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, setRead } from '@lib/database'
  import { bookmarks } from '@lib/stores'
  import { showSuccess } from '@lib/toasts'
  import { updateURLParam } from '@lib/utils'
  import EditableLong from '@components/common/EditableLong.svelte'
  import CodexSection from '@components/games/codex/CodexSection.svelte'

  export let user
  export let game
  export let isStoryteller

  let sections = [{ slug: 'general', name: 'Obecné' }]
  let activeSection = sections[0]

  onMount(() => {
    if (Array.isArray(game.codexSections)) { sections = [...sections, ...game.codexSections] }
    const section = new URLSearchParams(window.location.search).get('codex_section')
    if (section) { activeSection = sections.find((s) => { return s.slug === section }) || sections[0] }
    console.log('activeSection', activeSection)
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
  {#if game.open_codex || isStoryteller}
    {#if sections.length > 1}
      <div class='tabs tertiary codex'>
        {#each sections as section}
          <button on:click={() => { activate(section) }} class:active={activeSection.slug === section.slug}>
            {section.name}
          </button>
        {/each}
      </div>
    {/if}
    {#if activeSection.slug === 'general'}
      <!-- single section only -->
      <EditableLong userId={user.id} bind:value={game.info} onSave={updateGeneral} canEdit={isStoryteller} allowHtml />
      <br><br>
      Správce hry: {game.owner.name}
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
  .codex {
    display: flex;
    justify-content: center;
    margin-top: 0px;
    margin-bottom: 10px;
  }
    .codex button {
      display: inline-flex;
      gap: 10px;
      align-items: center;
    }
    .codex .active {
      color: var(--text);
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
