<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, setRead } from '@lib/database'
  import { showError, showSuccess } from '@lib/toasts'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let data
  export let isGameOwner

  let generatingStory = false

  /*
  async function updateAI () {
    const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: data.owner.id, system: data.system, storyteller: data.openai_storyteller, intro: data.intro, secrets: data.secrets }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    return json
  }
  */

  onMount(() => { if (user.id) { setRead(user.id, 'game-info-' + data.id) } })

  async function generateStory () {
    generatingStory = true
    data.secrets = 'načítám...'
    const res = await fetch('/api/game/generateStory', { method: 'POST', body: JSON.stringify({ game: data.id, intro: data.intro, owner: data.owner.id, system: data.system }), headers: { 'Content-Type': 'application/json' } })
    const json = await res.json()
    if (res.error || json.error) { return showError(res.error || json.error) }
    data.secrets = json.story
    // await updateAI()
    generatingStory = false
    showSuccess('Vygenerováno')
  }

  async function updateGameInfo (publicChange = true) {
    const newData = { intro: data.intro, info: data.info, secrets: data.secrets }
    if (publicChange) { newData.info_changed_at = new Date() }
    const { error } = await supabase.from('games').update(newData).eq('id', data.id)
    if (error) { return handleError(error) }
    // await updateAI()
    showSuccess('Uloženo')
  }
</script>

<h2 class='first'>Úvod</h2>
<EditableLong bind:value={data.intro} onSave={updateGameInfo} canEdit={isGameOwner} />

<h2>Pro hráče</h2>
<EditableLong bind:value={data.info} onSave={updateGameInfo} canEdit={isGameOwner} />

{#if isGameOwner}
  <h2>Podklady vypravěče <span>(hráčům skryté)</span></h2>
  <EditableLong bind:value={data.secrets} onSave={() => updateGameInfo(false)} canEdit={isGameOwner} loading={generatingStory} />
  <br>
  <button on:click={generateStory} disabled={generatingStory}>Vygenerovat podklady AI</button>
  <span class='warning'>Upozornění: Tato akce potrvá cca 5 minut a přepíše obsah tohoto pole.</span>
{/if}

<br><br><br><br>
Správce hry: {data.owner.name}

<style>
  h2 {
    margin-top: 50px;
  }
  h2.first {
    margin-top: 0px;
  }
    h2 span {
      font-size: 19px;
      font-style: italic;
      opacity: 0.5;
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
