<script>
  import { tooltip } from '@lib/tooltip'
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'

  export let concept
  export let user

  let checkLoop = null

  const isConceptEmpty = () => {
    return !concept.generated_world || !concept.generated_locations || !concept.generated_factions || !concept.generated_characters || !concept.generated_plan
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

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  function startGame () {
    window.location.href = `/solo/${concept.id}`
  }
</script>

{#if concept.generating}
  <h1>{concept.name}</h1>
  <div class='generating row'>
    <video src='/video/working.mp4' class='generating' autoplay loop muted playsinline alt='Generuji koncept' />
    <div class='info'>
      <h2>Prosím o strpení,<br>připravuji detaily konceptu...</h2>
      <ul>
        <li><span class='material'>{concept.generated_world && concept.generated_world !== 'generating' ? 'check' : 'hourglass_top'}</span>Svět</li>
        <li><span class='material'>{concept.generated_factions && concept.generated_factions !== 'generating' ? 'check' : 'hourglass_top'}</span>Frakce</li>
        <li><span class='material'>{concept.generated_locations && concept.generated_locations !== 'generating' ? 'check' : 'hourglass_top'}</span>Místa</li>
        <li><span class='material'>{concept.generated_characters && concept.generated_characters !== 'generating' ? 'check' : 'hourglass_top'}</span>Postavy</li>
        <li><span class='material'>{concept.generated_protagonist && concept.generated_protagonist !== 'generating' ? 'check' : 'hourglass_top'}</span>Protagonista</li>
        <li><span class='material'>{concept.generated_plan && concept.generated_plan !== 'generating' ? 'check' : 'hourglass_top'}</span>Plán hry</li>
        <li><span class='material'>{concept.generated_image && concept.generated_image !== 'generating' ? 'check' : 'hourglass_top'}</span>Ilustrace</li>
        <li><span class='material'>{concept.annotation && concept.annotation !== 'generating' ? 'check' : 'hourglass_top'}</span>Anotace</li>
      </ul>
    </div>
  </div>
{:else}
  <div class='headline'>
    <h1>{concept.name}</h1>
    {#if user.id === concept.author.id}
      <button on:click={showSettings} class='material settings square' title='Nastavení konceptu' use:tooltip>settings</button>
    {/if}
  </div>
  <div class='panel annotation'>
    <p>{@html concept.annotation || '<i>Žádný popis</i>'}</p>
    <button on:click={startGame} class='large'>Začít hru</button>
  </div>
{/if}

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    gap: 10px;
  }
    h1 {
      flex: 1;
      margin: 0;
    }
    .headline button {
      flex-shrink: 0;
    }
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
  button.large {
    display: block;
    margin: auto;
  }
</style>
