<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, getImage } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let game
  export let isStoryteller

  let activeMapUrl

  onMount(async () => {
    if (game.active_map) {
      activeMapUrl = await getImage(`${game.id}/${game.active_map.id}`, 'maps')
    }
  })

  async function updateMapDescription (description) {
    const { error } = await supabase.from('maps').update({ description }).eq('id', game.active_map.id)
    if (error) { handleError(error) }
    showSuccess('Popis mapy byl upraven')
  }

  async function deleteMap (mapId) {
    if (confirm('Opravdu chcete smazat tuto mapu?')) {
      const { error } = await supabase.from('maps').delete().eq('id', mapId)
      if (error) { handleError(error) }
      const { error: storageError } = await supabase.storage.from('maps').remove([`${game.id}/${mapId}`])
      if (storageError) { handleError(storageError) }
      game.maps = game.maps.filter(map => map.id !== mapId)
      showSuccess('Mapa byla smazána')
    }
  }
</script>

<div class='maps'>
  {#if game.active_map}
    <h2>{game.active_map.name}</h2>
    <img src={activeMapUrl} alt={game.active_map.name} />
    <EditableLong onSave={updateMapDescription} canEdit={isStoryteller} userId={user.id} value={game.active_map.description} allowHtml />
    {/if}
  <h2 class='row'>Seznam map</h2>
  {#if game.maps.length === 0}
    <center>Žádné mapy nenalezeny</center>
  {:else}
    <table class='mapList'>
      <tr>
        <th class='show'>Aktivní</th>
        <th class='name'>Název</th>
        {#if isStoryteller}
          <th class='tools'></th>
        {/if}
      </tr>
      {#each game.maps as map}
        <tr>
          <td class='show'></td>
          <td class='name'>{map.name}</td>
          {#if isStoryteller}
            <td class='tools row'>
              <a href={`/game/map-form?gameId=${game.id}&mapId=${map.id}`} class='button'>Upravit</a>
              <button type='button' on:click={() => { deleteMap(map.id) }}>Smazat</button>
            </td>
          {/if}
        </tr>
      {/each}
    </table>
  {/if}
</div>
{#if isStoryteller}
  <center><a href={`/game/map-form?gameId=${game.id}`} class='button addMap large'>Přidat mapu</a></center>
{/if}

<style>
  center {
    padding: 40px;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .mapList {
    width: 100%;
  }
  th {
    font-weight: normal;
    color: var(--dim);
    padding-left: 15px;
    text-align: left;
    font-size: 16px;
    padding-bottom: 10px;
  }
  td {
    padding: 5px 15px;
    vertical-align: middle;
    background-color: var(--block);
  }
  .name {
    width: 100%;
  }
</style>
