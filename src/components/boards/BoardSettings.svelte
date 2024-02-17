<script>
  import { onMount } from 'svelte'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database'
  import HeaderInput from '@components/common/HeaderInput.svelte'

  export let data = {}
  export let user = {}

  let saving = false
  let originalName

  onMount(setOriginal)

  function setOriginal () {
    originalName = data.name
  }

  async function updateBoard () {
    saving = true
    const { error } = await supabase.from('boards').update({ name: data.name }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    showSuccess('Změna diskuze uložena')
    saving = false
    await fetch('/api/cache?type=boards', { method: 'GET' }) // clear cache
  }

  async function deleteBoard () {
    await supabase.from('boards').delete().eq('id', data.id).then(({ error }) => {
      if (error) { return handleError(error) }
      window.location.href = '/boards?toastType=success&toastText=' + encodeURIComponent('Diskuze byla smazána')
    })
  }

  function showBoard () {
    window.location.href = `/board/${data.id}`
  }
</script>

<main>
  <div class='headline'>
    <h2>Nastavení diskuze "{data.name}"</h2>
    <button on:click={showBoard} class='material' title='Zpět do diskuze'>check</button>
  </div>

  {#if data.owner.id === user.id}
    <h3 class='first'>Vlastní hlavička</h3>
    Obrázek musí mít velikost alespoň 1100×226 px<br><br>
    <div class='row'>
      <label class='button' for='headerImage'>Nahrát obrázek</label>
      <HeaderInput {data} section='boards' unit='board' />
    </div>

    <h3>Název</h3>
    <div class='row'>
      <input type='text' id='boardName' name='boardName' bind:value={data.name} maxlength='80' />
      <button on:click={updateBoard} disabled={saving || (originalName === data.name)} class='material'>check</button>
    </div>

    <h3>Smazání diskuze</h3>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto diskuzi?')) { deleteBoard() } }}>
      <span class='material'>warning</span><span>Smazat diskuzi</span>
    </button>
  {:else}
    Tato sekce je jen pro vlastníka diskuze.
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
    #boardName {
      width: 100%;
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
