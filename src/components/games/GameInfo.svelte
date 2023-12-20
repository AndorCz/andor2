<script>
  import EditableLong from '@components/common/EditableLong.svelte'

  export let data
  export let isGameOwner
  
  let generatingStory = false

  async function generateStory () {
    generatingStory = true
    data.secrets = 'načítám...'
    const res = await fetch('/api/game/generateStory', {
      method: 'POST',
      body: JSON.stringify({ game: data.id, intro: data.intro, owner: data.owner.id, system: data.system }),
      headers: { 'Content-Type': 'application/json' }
    })
    res.json().then((res) => {
      if (res.error) { showError(res.error) }
      else {
        showSuccess('Vygenerováno')
        generatingStory = false
        data.secrets = res.story
      }
    })
  }

  async function updateGame () {
    const clean = clone(data)
    delete clean.id
    delete clean.player
    delete clean.owner
    delete clean.characters
    const { error } = await supabase.from('games').update(clean).eq('id', data.id)
    if (error) { handleError(error) }
    else { showSuccess('Uloženo') }
  }
</script>


<h2>Úvod</h2>

<EditableLong bind:value={data.intro} onSave={updateGame} canEdit={isGameOwner} />

<h2>Pro hráče</h2>
<EditableLong bind:value={data.info} onSave={updateGame} canEdit={isGameOwner} />

{#if isGameOwner}
  <h2>Podklady vypravěče <span>(hráčům skryté)</span></h2>
  <EditableLong bind:value={data.secrets} onSave={updateGame} canEdit={isGameOwner} loading={generatingStory} />
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
    h2 span {
      font-size: 14pt;
      font-style: italic;
      opacity: 0.5;
    }
  .warning {
    margin-left: 20px;
  }
</style>