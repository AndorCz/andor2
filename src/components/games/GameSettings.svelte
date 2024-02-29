<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import { gameSystems, gameCategories } from '@lib/constants'
  import HeaderInput from '@components/common/HeaderInput.svelte'

  export let data = {}
  export let user = {}

  let saving = false
  let originalSystem
  let originalName
  let originalCategory

  onMount(setOriginal)

  function setOriginal () {
    originalName = data.name
    originalSystem = data.system
    originalCategory = data.category
  }

  async function updateGame () {
    saving = true
    const { error } = await supabase.from('games').update({ name: data.name, category: data.category, system: data.system }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    // update AI storyteller if system changed
    /*
    if (originalSystem !== data.system) {
      const res = await fetch('/api/game/updateAI', { method: 'POST', body: JSON.stringify({ owner: data.owner.id, system: data.system, storyteller: data.openai_storyteller, annotation: data.annotation, secrets: data.secrets }), headers: { 'Content-Type': 'application/json' } })
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
  .delete {
    display: flex;
    gap: 10px;
  }

  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
  }
</style>
