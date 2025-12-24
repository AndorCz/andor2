<script>
  import { showSuccess } from '@lib/toasts'
  import { isFilledArray } from '@lib/utils'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import Map from '@components/games/maps/Map.svelte'
  import Sortable from 'sortablejs'

  let { user, game = $bindable(), isStoryteller } = $props()

  let mapListEl = $state(null)
  let sortableInstance = $state(null)
  let initialized = $state(false)
  let isSortable = $state(false)
  let mapSaving = $state(false)
  let sortKey = $state(0)

  function sortMaps (maps) {
    return [...maps].sort((a, b) => (a.index ?? 0) - (b.index ?? 0) || a.name.localeCompare(b.name))
  }

  const sortedMaps = $derived(Array.isArray(game.maps) ? sortMaps(game.maps) : [])

  game.maps?.forEach(map => {
    map.isOpen = map.isActive
    map.isActive = map.id === game.active_map?.id
  })

  game.characters?.forEach(character => {
    character.portraitUrl = character.portrait ? getPortraitUrl(character.id, character.portrait) : null
  })

  $effect(() => {
    if (isStoryteller && !initialized && mapListEl && sortedMaps.length && !isSortable) {
      sortableInstance = new Sortable(mapListEl, {
        animation: 150,
        handle: '.handle',
        dataIdAttr: 'data-id',
        onEnd
      })
      isSortable = true
      initialized = true
    }
  })

  async function onEnd (sort) {
    if (sort.oldIndex === sort.newIndex) { return }
    mapSaving = true

    const orderedIds = Array.from(sort.from.children).map((child) => child.dataset.id)
    const currentMaps = $state.snapshot(game.maps)
    const reordered = orderedIds
      .map((id, index) => {
        const currentMap = currentMaps.find((m) => `${m.id}` === id)
        if (!currentMap) { return null }
        return { ...currentMap, index }
      })
      .filter(Boolean)

    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
      isSortable = false
      initialized = false
    }

    await Promise.all(reordered.map((map) => updateMapIndex(map.id, map.index)))
    if (reordered.length) {
      game.maps = reordered
    }

    sortKey++
    mapSaving = false
    showSuccess('Pořadí map uloženo')
  }

  async function updateMapIndex (mapId, newIndex) {
    const { error } = await supabase.from('maps').update({ index: newIndex }).eq('id', mapId)
    if (error) { handleError(error) }
  }

  async function deleteMap (mapId) {
    if (confirm('Opravdu chcete smazat tuto mapu?')) {
      if (game.active_map?.id === mapId) {
        const { error } = await supabase.from('games').update({ active_map_id: null }).eq('id', game.id)
        if (error) { handleError(error) }
        game.active_map = null
      }
      const { error } = await supabase.from('maps').delete().eq('id', mapId)
      if (error) { handleError(error) }

      const { error: storageError } = await supabase.storage.from('maps').remove([`${game.id}/${mapId}_fow`])
      if (storageError) { handleError(storageError) }

      const { error: storageError2 } = await supabase.storage.from('maps').remove([`${game.id}/${mapId}`])
      if (storageError2) { handleError(storageError2) }

      game.maps = game.maps.filter(map => map.id !== mapId)
      showSuccess('Mapa byla smazána')
    }
  }
</script>

<div class='maps'>
  {#if isFilledArray(sortedMaps)}
    {#key sortKey}
      <div bind:this={mapListEl} class:saving={mapSaving}>
        {#each sortedMaps as map (map.id)}
          {#if (!map.hidden || isStoryteller)}
            <div class='mapItem' data-id={map.id}>
              <h3>
                {#if isStoryteller}
                  <svg class='handle' width='20px' height='20px' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'>
                    <circle cx='12.5' cy='5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='12.5' r='2.5' fill='currentColor'/><circle cx='12.5' cy='20' r='2.5' fill='currentColor'/>
                  </svg>
                {/if}
                <button onclick={() => { map.isOpen = !map.isOpen }} class='plain'>
                  <span class='material arrow' class:isOpen={map.isOpen}>arrow_drop_down</span>
                  <span class='name'>{#if map.hidden}<span class='material'>visibility_off</span>{/if}{map.name}</span>
                </button>
              </h3>
              {#if map.isOpen}
                <Map {user} {game} {map} {isStoryteller} onDeleteMap={deleteMap} />
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/key}
  {:else}
    <center>Žádné mapy nenalezeny</center>
  {/if}
</div>
{#if isStoryteller}
  <center><a href={`/game/map-form?gameId=${game.id}`} class='button addMap large'>Přidat mapu</a></center>
{/if}

<style>
  center { padding: 40px }
  h3 {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
    .name {
      font-variation-settings: 'wght' 600;
      font-size: 1.5em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    h3 button {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 10px;
    }
    h3 button:hover {
      color: var(--buttonTxHover);
    }
    .arrow {
      transform: rotate(0deg);
      transition: transform 0.3s;
    }
      .arrow.isOpen {
        transform: rotate(180deg);
      }
    .handle {
      display: block;
      color: var(--text);
      opacity: 0.3;
      min-width: 14px;
      width: 14px;
      height: 20px;
      cursor: grab;
      transform: scale(1.4);
      transform-origin: center;
      margin-right: 5px;
    }
      .handle:hover {
        opacity: 1;
      }
    .saving {
      opacity: 0.5;
      pointer-events: none;
    }
</style>
