<script>
  import { onMount } from 'svelte'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database'
  import { gameSystems, gameCategories } from '@lib/constants'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import HeaderInput from '@components/common/HeaderInput.svelte'

  export let data = {}
  export let user = {}

  let saving = false
  let originalSystem
  let originalName
  let originalCategory
  let originalOpenDiscussion
  let originalOpenInfo
  let originalAnnotation

  onMount(setOriginal)

  function setOriginal () {
    originalName = data.name
    originalSystem = data.system
    originalCategory = data.category
    originalOpenDiscussion = data.open_discussion
    originalAnnotation = data.annotation
    originalOpenInfo = data.open_info
  }

  async function updateGame () {
    saving = true
    const { error } = await supabase.from('games').update({ name: data.name, annotation: data.annotation, category: data.category, system: data.system, open_discussion: data.open_discussion, open_info: data.open_info }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    // update AI storyteller if system changed
    /*
    if (originalSystem !== data.system) {
      const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: data.owner.id, system: data.system, storyteller: data.openai_storyteller, annotation: data.annotation, prompt: data.prompt }), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
    }
    */
    showSuccess('Změna hry uložena')
    saving = false
    // await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
  }

  async function deleteGame () {
    const { error } = await supabase.from('games').delete().eq('id', data.id)
    if (error) { return handleError(error) }
    // await fetch('/api/cache?type=games', { method: 'GET' }) // clear cache
    window.location.href = '/games?toastType=success&toastText=' + encodeURIComponent('Hra byla smazána')
  }

  function showGame () {
    window.location.href = `/game/${data.id}`
  }

  function exportGame () {
    window.location.href = '/api/game/download?game=' + data.id
  }
</script>

<main>
  <div class='headline'>
    <h2>Nastavení hry "{data.name}"</h2>
    <button on:click={showGame} class='material' title='Zpět do hry'>check</button>
  </div>

  {#if data.owner.id === user.id}
    <h3 class='first'>Vlastní hlavička</h3>
    Obrázek musí mít velikost alespoň 1100×226 px<br><br>
    <div class='row'>
      <label class='button' for='headerImage'>Nahrát obrázek</label>
      <HeaderInput {data} section='games' unit='game' />
    </div>

    <h3>Název</h3>
    <div class='row'>
      <input type='text' id='gameName' name='gameName' bind:value={data.name} maxlength='80' />
      <button on:click={updateGame} disabled={saving || (originalName === data.name)} class='material'>check</button>
    </div>

    <h3>Anotace</h3>
    <div class='row'>
      <TextareaExpandable userId={user.id} id='gameAnnotation' name='gameAnnotation' bind:value={data.annotation} />
      <button on:click={updateGame} disabled={saving || originalAnnotation === data.annotation} class='material save'>check</button>
    </div>

    <h3>Kategorie</h3>
    <div class='row'>
      <select id='gameCategory' name='gameCategory' bind:value={data.category}>
        {#each gameCategories as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || (originalCategory === data.category)} class='material'>check</button>
    </div>

    <h3>Herní systém</h3>
    <div class='row'>
      <select id='gameSystem' name='gameSystem' bind:value={data.system}>
        {#each gameSystems as system}
          <option value={system.value}>{system.label}</option>
        {/each}
      </select>
      <button on:click={updateGame} disabled={saving || (originalSystem === data.system)} class='material'>check</button>
    </div>

    <h3>Mód diskuze</h3>
    <div class='row'>
      <select id='gameOpenDiscussion' name='gameOpenDiscussion' bind:value={data.open_discussion}>
        <option value={false}>Soukromá</option>
        <option value={true}>Veřejná</option>
      </select>
      <button on:click={updateGame} disabled={saving || (originalOpenDiscussion === data.open_discussion)} class='material'>check</button>
    </div>

    <h3>Mód info stránky</h3>
    <div class='row'>
      <select id='gameOpenInfo' name='gameOpenInfo' bind:value={data.open_info}>
        <option value={true}>Veřejná</option>
        <option value={false}>Soukromá</option>
      </select>
      <button on:click={updateGame} disabled={saving || (originalOpenInfo === data.open_info)} class='material'>check</button>
    </div>

    <h3>Záloha do souboru</h3>
    <button class='export' on:click={exportGame}>
      <span class='material'>download</span><span>Stáhnout zálohu</span>
    </button>

    <h3>Smazání hry</h3>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto hru?')) { deleteGame() } }}>
      <span class='material'>warning</span><span>Smazat hru</span>
    </button>
  {:else}
    Tato sekce je jen pro vlastníka hry.
  {/if}
</main>

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
    h2 {
      margin: 0px;
    }
    .headline button {
      padding: 10px;
      margin-left: 10px;
    }

  h3 {
    margin-top: 50px;
  }
  .row {
    display: flex;
    gap: 10px;
  }
    #gameName {
      width: 100%;
    }
    select {
      width: 100%;
      max-width: 400px;
    }
  .delete, .export {
    display: flex;
    gap: 10px;
  }

  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
  }
</style>
