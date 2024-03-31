<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import { lightboxImage } from '@lib/stores'
  import { supabase, handleError, getImage } from '@lib/database'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let game
  export let isStoryteller

  let shownMap = {}
  let activeMapUrl

  onMount(async () => {
    if (game.active_map) {
      shownMap = game.active_map
      activeMapUrl = await getImage(`${game.id}/${shownMap.id}?${shownMap.image}`, 'maps')
    }
  })

  async function updateMapDescription (description) {
    const { error } = await supabase.from('maps').update({ description }).eq('id', shownMap.id)
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

  async function toggleActive (mapId) {
    const isActive = game.active_map && game.active_map.id === mapId
    game.active_map = isActive ? null : game.maps.find(map => map.id === mapId)
    activeMapUrl = isActive ? '' : getImage(`${game.id}/${game.active_map.id}?${game.active_map.image}`, 'maps')
    const { error } = await supabase.from('games').update({ active_map: isActive ? null : mapId }).eq('id', game.id)
    if (error) { return handleError(error) }
    if (isActive) { shownMap = {} } else { showMap(mapId) }
    return showSuccess(isActive ? 'Mapa byla deaktivována' : 'Mapa byla aktivována, zobrazí se všem hráčům')
  }

  function showMap (id) {
    if (id !== shownMap?.id) {
      shownMap = game.maps.find(map => map.id === id)
      activeMapUrl = getImage(`${game.id}/${shownMap.id}?${shownMap.image}`, 'maps')
    }
  }
</script>

<div class='maps'>
  {#if shownMap.id}
    <h2>{shownMap.name}</h2>
    <div id='map'>
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
      <img class='mapImage' src={activeMapUrl} alt={shownMap.name} on:click={() => { $lightboxImage = activeMapUrl }} />
    </div>
    <EditableLong onSave={updateMapDescription} canEdit={isStoryteller} userId={user.id} value={shownMap.description} allowHtml />
  {/if}
  <h2>Seznam map</h2>
  {#if game.maps.length === 0}
    <center>Žádné mapy nenalezeny</center>
  {:else}
    <table class='mapList'>
      <tr>
        <th class='name'>Název</th>
        {#if isStoryteller}
          <th class='tools'></th>
        {/if}
      </tr>
      {#each game.maps as map}
        {#if !map.hidden || isStoryteller}
          <tr>
            <td class='name'>
              {#if shownMap.id === map.id}
                <div class='mapName row'><span class='material'>visibility</span> {map.name}</div>
              {:else}
                <button class='mapName plain' on:click={() => showMap(map.id)}>{map.name}</button>
              {/if}
            </td>
            {#if isStoryteller}
              <td class='tools row'>
                {#if game.active_map && game.active_map.id === map.id}
                  <button type='button' on:click={() => { toggleActive(map.id) }} class='row'>Deaktivovat</button>
                {:else}
                  <button type='button' on:click={() => { toggleActive(map.id) }} class='row' title='Nastaví mapu jako aktuální prostředí pro všechny postavy. Otevře se hráčům sama.' use:tooltip>Aktivovat</button>
                {/if}
                <a href={`/game/map-form?gameId=${game.id}&mapId=${map.id}`} class='button material' title='Upravit'>edit</a>
                <button type='button' on:click={() => { deleteMap(map.id) }} class='material' title='Smazat'>delete</button>
              </td>
            {/if}
          </tr>
        {/if}
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
  .tools {
    justify-content: flex-end;
  }
  #map {
    margin: auto;
    width: fit-content;
  }
    .mapImage {
      max-width: 100%;
      cursor: pointer;
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
    .mapName  {
      padding: 10px 0px;
      width: 100%;
      text-align: left;
    }
</style>
