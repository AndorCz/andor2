<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, setRead } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let data
  export let isStoryteller

  let generatingStory = false

  /*
  async function updateAI () {
    const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: data.owner.id, system: data.system, storyteller: data.openai_storyteller, annotation: data.annotation, secrets: data.secrets }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    return json
  }
  */

  onMount(() => {
    if (user.id) {
      delete data.unread.gameInfo
      setRead(user.id, 'game-info-' + data.id)
    }
  })

  async function generateStory () {
    if (!confirm('Opravdu chceš vygenerovat nové podklady pro vypravěče? Přepíše obsah tohoto pole.')) { return }
    generatingStory = true
    data.secrets = 'načítám...'
    const res = await fetch('/api/game/generateStory', { method: 'POST', body: JSON.stringify({ game: data.id, annotation: data.annotation, owner: data.owner.id, system: data.system }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    data.secrets = json.story
    // await updateAI()
    generatingStory = false
    showSuccess('Vygenerováno')
  }

  async function updateGameInfo (publicChange = true) {
    const newData = { secrets: data.secrets }
    if (publicChange) { newData.info_changed_at = new Date() }
    const { error } = await supabase.from('games').update(newData).eq('id', data.id)
    if (error) { return handleError(error) }
    // await updateAI()
    showSuccess('Uloženo')
  }
</script>

<main>
  Tuto stránku vidí pouze vypravěči.

  <h2>Podklady pro AI</h2>
  <EditableLong bind:value={data.secrets} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} loading={generatingStory} />
  <br>
  <button on:click={generateStory} disabled={generatingStory}>Vygenerovat podklady AI</button>
  <span class='warning'>Upozornění: Tato akce potrvá cca 5 minut a přepíše obsah tohoto pole.</span>
</main>

<style>
  main {
    padding-top: 40px;
  }
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
