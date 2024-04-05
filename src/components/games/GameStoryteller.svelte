<script>
  import { supabase, handleError } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let game
  export let isStoryteller

  let generatingStory = false

  /*
  async function updateAI () {
    const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: game.owner.id, system: game.system, storyteller: game.openai_storyteller, annotation: game.annotation, prompt: game.prompt }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    return json
  }
  */

  async function generateStory () {
    if (!confirm('Opravdu chceš vygenerovat nové podklady pro vypravěče? Přepíše obsah tohoto pole.')) { return }
    generatingStory = true
    game.prompt = 'načítám...'
    const res = await fetch('/api/game/generateStory', { method: 'POST', body: JSON.stringify({ game: game.id, annotation: game.annotation, owner: game.owner.id, system: game.system }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    game.prompt = json.story
    // await updateAI()
    generatingStory = false
    showSuccess('Vygenerováno')
  }

  async function updateGameInfo () {
    const newData = { prompt: game.prompt, notes: game.notes }
    const { error } = await supabase.from('games').update(newData).eq('id', game.id)
    if (error) { return handleError(error) }
    // await updateAI()
    showSuccess('Uloženo')
  }
</script>

<main>
  <h2>Poznámky</h2>
  <EditableLong userId={user.id} bind:value={game.notes} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} />

  <h2>Podklady pro AI</h2>
  <EditableLong userId={user.id} bind:value={game.prompt} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} loading={generatingStory} />
  <br>
  <button on:click={generateStory} disabled={generatingStory}>Vygenerovat podklady AI</button>
  <span class='warning'>Upozornění: Tato akce potrvá cca 5 minut a přepíše obsah tohoto pole.</span>
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
