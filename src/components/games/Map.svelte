<script>
  import { onMount } from 'svelte'
  import { lightboxImage } from '@lib/stores'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError, getImageUrl } from '@lib/database'
  import { tooltip } from '@lib/tooltip'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let map
  export let game
  export let user
  export let onDeleteMap
  export let isActive = false // open to all players by default
  export let isStoryteller = false

  let isOpen = isActive
  let mapUrl = ''

  onMount(() => {
    mapUrl = getImageUrl(`${game.id}/${map.id}?${map.image}`, 'maps')
  })

  async function updateMapDescription (description) {
    console.log('updating map id', map.id)
    const { error } = await supabase.from('maps').update({ description }).eq('id', map.id)
    if (error) { handleError(error) }
    showSuccess('Popis mapy byl upraven')
  }

  async function toggleActive () {
    const { error } = await supabase.from('games').update({ active_map: isActive ? null : map.id }).eq('id', game.id)
    if (error) { return handleError(error) }
    isActive = !isActive
    isOpen = !isOpen
    return showSuccess(isActive ? 'Mapa byla aktivována, zobrazí se všem hráčům' : 'Mapa byla deaktivována')
  }
</script>

<h2>
  <button on:click={() => { isOpen = !isOpen }} class='plain'>
    <span class='material arrow' class:isOpen>arrow_drop_down</span>
    <span class='name'>{map.name}{#if map.hidden} (skrytá){/if}</span>
  </button>

  {#if isStoryteller}
    <td class='tools row'>
      {#if isActive}
        <button type='button' on:click={toggleActive}>Deaktivovat</button>
      {:else}
        <button type='button' on:click={toggleActive} title='Nastaví mapu jako aktuální prostředí pro všechny postavy. Otevře se hráčům sama.' use:tooltip>Aktivovat</button>
      {/if}
      <a href={`/game/map-form?gameId=${game.id}&mapId=${map.id}`} class='material square button' title='Upravit'>edit</a>
      <button type='button' on:click={() => { onDeleteMap(map.id) }} class='material square' title='Smazat'>delete</button>
    </td>
  {/if}
</h2>

{#if isOpen}
  <div id='map'>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
    <img class='mapImage' src={mapUrl} alt={map.name} on:click={() => { $lightboxImage = mapUrl }} />
  </div>
  <EditableLong onSave={updateMapDescription} canEdit={isStoryteller} userId={user.id} value={map.description} allowHtml />
{/if}

<style>
  h2 {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
    .name {
      font-variation-settings: 'wght' 600;
      font-size: 1.5em;
    }
    h2 button {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 10px;
    }
    .arrow {
      transform: rotate(0deg);
      transition: transform 0.3s;
    }
      .arrow.isOpen {
        transform: rotate(180deg);
      }

  .tools {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  #map {
    margin: auto;
    width: fit-content;
  }
    .mapImage {
      max-width: 100%;
      cursor: pointer;
    }
</style>
