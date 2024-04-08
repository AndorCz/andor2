<script>
  import { onMount, onDestroy } from 'svelte'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError, getImageUrl } from '@lib/database'
  import { tooltip } from '@lib/tooltip'
  import { Application, Sprite, Assets } from 'pixi.js'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let map
  export let game
  export let user
  export let onDeleteMap
  export let isStoryteller = false

  let mapEl
  let mapWrapperEl
  let mapUrl = ''

  let app
  let mapSprite

  onMount(async () => {
    mapUrl = getImageUrl(`${game.id}/${map.id}?${map.image}`, 'maps')
    app = new Application()
    await app.init({ backgroundAlpha: 0, resizeTo: mapEl })
    mapEl.appendChild(app.canvas)
    const mapTexture = await Assets.load({ src: mapUrl, loadParser: 'loadTextures' })
    mapSprite = new Sprite(mapTexture)
    mapSprite.anchor.set(0.5, 0.5)
    app.stage.pivot.x = -app.screen.width / 2
    app.stage.pivot.y = -app.screen.height / 2
    app.stage.addChild(mapSprite)
    window.addEventListener('resize', resize)
    resize()
  })

  onDestroy(() => { window.removeEventListener('resize', resize) })

  function resize () {
    if (!mapEl) return
    const scale = Math.min(mapEl.offsetWidth / mapSprite.width, 1)
    mapWrapperEl.style.height = `${mapSprite.height * scale}px`
    app.renderer.resize(mapEl.offsetWidth, mapEl.offsetHeight)
    app.stage.scale.set(scale, scale) // or app.renderer.resize(mapEl.offsetWidth, mapEl.offsetHeight)
    app.stage.pivot.x = (-app.screen.width / scale) / 2
    app.stage.pivot.y = (-app.screen.height / scale) / 2
  }

  async function updateMapDescription (description) {
    const { error } = await supabase.from('maps').update({ description }).eq('id', map.id)
    if (error) { handleError(error) }
    showSuccess('Popis mapy byl upraven')
  }

  async function toggleActive () {
    const { error } = await supabase.from('games').update({ active_map: map.isActive ? null : map.id }).eq('id', game.id)
    if (error) { return handleError(error) }
    map.isActive = !map.isActive
    return showSuccess(map.isActive ? 'Mapa byla aktivována, zobrazí se všem hráčům' : 'Mapa byla deaktivována')
  }
</script>

<div class='wrapper' bind:this={mapWrapperEl}>
  <div id='map' bind:this={mapEl}></div>
</div>
<br><br>
<EditableLong onSave={updateMapDescription} canEdit={isStoryteller} userId={user.id} value={map.description} allowHtml />
{#if isStoryteller}
  <td class='tools row'>
    {#if map.isActive}
      <button type='button' on:click={toggleActive}>Deaktivovat</button>
    {:else}
      <button type='button' on:click={toggleActive} title='Nastaví mapu jako aktuální prostředí pro všechny postavy. Otevře se hráčům sama.' use:tooltip>Aktivovat</button>
    {/if}
    <a href={`/game/map-form?gameId=${game.id}&mapId=${map.id}`} class='material square button' title='Upravit' use:tooltip>edit</a>
    <button type='button' on:click={() => { onDeleteMap(map.id) }} class='material square' title='Smazat' use:tooltip>delete</button>
  </td>
{/if}

<style>
  .wrapper {
    position: relative;
    height: 600px;
  }
    #map {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }

  .tools {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 40px;
    gap: 10px;
  }
</style>
