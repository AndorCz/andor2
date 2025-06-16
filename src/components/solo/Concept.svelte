<script>
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'

  export let concept

  let checkLoop = null

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
        const { data, error } = await supabase.from('solo_concepts').select('generating').eq('id', concept.id).single()
        if (error) { handleError(error) }
        if (data && !data.generating) {
          concept.generating = false
          clearInterval(checkLoop)
          checkLoop = null
        }
      }, 5000)
    }
  })

  onDestroy(() => { if (checkLoop) { clearInterval(checkLoop) } })
</script>

<h1>{concept.name}</h1>

{#if concept.generating}
  <div class='generating'>
    <video src='/public/video/working.mp4' class='generating' autoplay loop muted playsinline alt='Generuji koncept' />
    <h2>Generuji detaily konceptu...</h2>
  </div>
{:else}
  details...
{/if}

<style>
  .generating {
    text-align: center;
    margin-top: 20px;
  }
  .generating video {
    width: 320px;
    height: 320px;
    display: block;
    margin: 0 auto;
    border-radius: 50%;
  }
</style>
