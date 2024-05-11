<script>
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let game
  export let isStoryteller

  let generatingStory = false
  let eventSource

  /*
  async function updateAI () {
    const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: game.owner.id, system: game.system, storyteller: game.openai_storyteller, annotation: game.annotation, prompt: game.prompt }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    return json
  }
  */

  async function generateStory () {
    if (!confirm('Opravdu chceš vygenerovat nové podklady pro vypravěče? Přepíše obsah pole níže.')) { return }
    game.story = ''
    generatingStory = true

    eventSource = new EventSource(`/api/game/generateStory?name=${encodeURIComponent(game.name)}&annotation=${encodeURIComponent(game.annotation)}&prompt=${encodeURIComponent(game.prompt)}&system=${encodeURIComponent(game.system)}&gameId=${game.id}`)

    eventSource.onmessage = (event) => {
      showSuccess('Část příběhu vygenerována')
      if (event.data) {
        game.story += decodeURIComponent(event.data)
      }
    }

    eventSource.addEventListener('success', (event) => {
      generatingStory = false
      showSuccess('Vygenerováno')
      eventSource.close()
    })

    eventSource.onerror = (event) => {
      generatingStory = false
      showError('Nastala chyba při generování příběhu')
      eventSource.close()
      console.log('event', event)
    }

    // await updateAI()
  }

  async function cancelGeneration () {
    eventSource.close()
    generatingStory = false
    showSuccess('Generování zrušeno')
  }

  async function updateGameInfo () {
    const newData = { prompt: game.prompt, notes: game.notes, story: game.story }
    const { error } = await supabase.from('games').update(newData).eq('id', game.id)
    if (error) { return handleError(error) }
    // await updateAI()
    showSuccess('Uloženo')
  }
</script>

<main>
  <h2>Poznámky</h2>
  <EditableLong userId={user.id} bind:value={game.notes} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} />

  <h2>AI generování podkladů</h2>
  <EditableLong userId={user.id} bind:value={game.prompt} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} loading={generatingStory} />
  <br>
  {#if generatingStory}
    <button on:click={cancelGeneration}>Zrušit generování</button>
  {:else}
    <button on:click={generateStory} loading={generatingStory} disabled={game.prompt?.length < 20}>Vygenerovat podklady AI</button>
  {/if}
  <span class='warning'>Upozornění: Tato akce potrvá cca 5-10 minut a přepíše obsah pole níže.</span>
  <br><br>
  <EditableLong allowHtml placeholder='Výstup generovaných podkladů' userId={user.id} bind:value={game.story} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} loading={generatingStory} />
</main>

<style>
  h2 {
    margin-top: 50px;
  }
  .warning {
    margin-left: 20px;
  }

  @media (max-width: 860px) {
    .warning {
      display: block;
      margin-left: 0px;
      padding-top: 20px;
    }
  }
</style>
