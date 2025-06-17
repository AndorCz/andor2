<script>
  import { getSavedStore } from '@lib/stores'
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let concept
  export let user

  let checkLoop = null
  const conceptStore = getSavedStore('concept-' + concept.id)

  const isConceptEmpty = () => {
    return !concept.story_world || !concept.story_locations || !concept.story_factions || !concept.story_characters || !concept.story_plan
  }

  onMount(async () => {
    // Call generation API and periodically check if the concept is done generating
    if (!concept.generating && isConceptEmpty()) {
      concept.generating = true
      await fetch('/api/solo/generateConcept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conceptId: concept.id }) })

      // Save timer to check status every 5 seconds
      checkLoop = setInterval(async () => {
        console.log('checking concept generation status...')
        const { data, error } = await supabase.from('solo_concepts').select().eq('id', concept.id).single()
        if (error) { handleError(error) }
        if (data) { concept = data }
        if (data && !data.generating) {
          clearInterval(checkLoop)
          checkLoop = null
        }
      }, 5000)
    }
  })

  onDestroy(() => { if (checkLoop) { clearInterval(checkLoop) } })

  async function onSave (value) {
    // Save the updated concept data
    await supabase.from('solo_concepts').update({
      story_world: concept.story_world,
      story_factions: concept.story_factions,
      story_locations: concept.story_locations,
      story_characters: concept.story_characters,
      story_protagonist: concept.story_protagonist,
      story_plan: concept.story_plan
    }).eq('id', concept.id)
  }

  function changeTab (tab) {
    if (tab === 'storyteller' && window.confirm('Stránka obsahuje spoilery. Zobrazit informace pro vypravěče?')) {
      $conceptStore.activeTab = tab
      history.pushState({}, '', `?tab=${tab}`)
    }
  }
</script>

<h1>{concept.name}</h1>

{#if concept.generating}
  <div class='generating row'>
    <video src='/video/working.mp4' class='generating' autoplay loop muted playsinline alt='Generuji koncept' />
    <div class='info'>
      <h2>Prosím o strpení,<br>připravuji detaily konceptu...</h2>
      <ul>
        <li><span class='material'>{concept.story_world ? 'check' : 'hourglass_top'}</span> Svět</li>
        <li><span class='material'>{concept.story_factions ? 'check' : 'hourglass_top'}</span> Frakce</li>
        <li><span class='material'>{concept.story_locations ? 'check' : 'hourglass_top'}</span> Místa</li>
        <li><span class='material'>{concept.story_characters ? 'check' : 'hourglass_top'}</span> Postavy</li>
        <li><span class='material'>{concept.story_protagonist ? 'check' : 'hourglass_top'}</span> Protagonista</li>
        <li><span class='material'>{concept.story_plan ? 'check' : 'hourglass_top'}</span> Plán hry</li>
      </ul>
    </div>
  </div>
{:else}
  {#if user.id === concept.user_id}
    <nav class='tabs secondary'>
      <button on:click={() => { changeTab('player') }} class={$conceptStore.activeTab === 'player' ? 'active' : ''}>
        Pro hráče
      </button>
      <button on:click={() => { changeTab('storyteller') }} class={$conceptStore.activeTab === 'storyteller' ? 'active' : ''}>
        Pro vypravěče
      </button>
    </nav>
  {/if}
  {#if $conceptStore.activeTab === 'storyteller'}
    <div class='spoilers'>
      <h2>Svět</h2>
      <EditableLong {user} value={concept.story_world} {onSave} canEdit allowHtml />
      <h2>Frakce</h2>
      <EditableLong {user} value={concept.story_factions} {onSave} canEdit allowHtml />
      <h2>Místa</h2>
      <EditableLong {user} value={concept.story_locations} {onSave} canEdit allowHtml />
      <h2>Postavy</h2>
      <EditableLong {user} value={concept.story_characters} {onSave} canEdit allowHtml />
      <h2>Protagonista</h2>
      <EditableLong {user} value={concept.story_protagonist} {onSave} canEdit allowHtml />
      <h2>Plán hry</h2>
      <EditableLong {user} value={concept.story_plan} {onSave} canEdit allowHtml />
    </div>
  {:else}
    <div class='panel annotation'>
      <h2>Popis</h2>
      {@html concept.annotation || '<i>Žádný popis</i>'}
    </div>
  {/if}
{/if}

<style>
  .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
  .generating {
    text-align: center;
    margin-top: 20px;
  }
    .generating video {
      width: 320px;
      height: 320px;
      display: block;
      margin: 0 auto;
      border-radius: 20px;
    }
  .info {
    flex: 1;
    text-align: left;
  }
  ul {
    list-style: none;
    padding: 0;
    width: min-content;
    text-align: left;
  }
    ul li {
      gap: 10px;
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
</style>
