<script>
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError, getImageUrl, getPortrait } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import { tooltip } from '@lib/tooltip'
  import { MaskContainer } from '@lib/pixi'
  import { Application, Circle, Sprite, Assets, Graphics, Text } from 'pixi.js'
  import { DropShadowFilter } from 'pixi-filters'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let map
  export let game
  export let user
  export let onDeleteMap
  export let isStoryteller = false

  let mapUrl = ''
  let mapEl, mapWrapperEl, app, mapSprite, mapTexture, dragTarget
  const tokenSize = 50
  const halfSize = tokenSize / 2
  const quarterSize = tokenSize / 4

  onMount(async () => {
    mapUrl = getImageUrl(`${game.id}/${map.id}?${map.image}`, 'maps')
    app = new Application()
    globalThis.__PIXI_APP__ = app // for debugging
    await app.init({ backgroundAlpha: 0 })
    mapEl.appendChild(app.canvas)

    // add background image
    mapTexture = await Assets.load({ src: mapUrl, loadParser: 'loadTextures' })
    mapSprite = new Sprite(mapTexture)
    mapSprite.label = 'map'
    app.stage.addChild(mapSprite)
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage.on('pointerup', onDragEnd)
    app.stage.on('pointerupoutside', onDragEnd)

    // add character tokens
    for (const character of game.characters) {
      await addCharacter(character)
    }

    window.addEventListener('resize', resize)
    resize()
  })

  onDestroy(() => { window.removeEventListener('resize', resize) })

  function resize () {
    if (!mapEl) return
    const scale = Math.min(mapEl.offsetWidth / mapSprite.width, 1)
    mapWrapperEl.style.height = `${mapSprite.height * scale + 100}px`
    app.stage.scale.set(scale, scale)
    app.renderer.resize(mapTexture.width * scale, mapEl.offsetHeight)

    // position objects
    app.stage.children.forEach((child, index) => {
      if (child.label === 'map') { return }
      child.x = tokenSize * (index - 1) + (index * quarterSize) + quarterSize
      child.y = mapSprite.height + tokenSize
    })
  }

  async function addCharacter (character) {
    const portraitUrl = await getPortrait(character.id, character.portrait)
    const texture = await Assets.load({ src: portraitUrl, loadParser: 'loadTextures' })
    const portrait = new Sprite(texture)
    const scale = Math.max(tokenSize / portrait.width, tokenSize / portrait.height)
    portrait.scale.set(scale)
    portrait.anchor.set(0.5, 0)

    // circular mask
    const token = new MaskContainer() // workaround for missing pixi.js feature (interaction on masked sprites)
    const mask = new Graphics().circle(portrait.x, portrait.y, halfSize).fill(0xFFFFFF)
    portrait.mask = mask
    mask.pivot.y = -halfSize // show head of the character
    token.pivot.y = halfSize // counteract the mask pivot
    token.label = character.name
    token.addChild(mask)
    token.addChild(portrait)
    token.filters = [new DropShadowFilter()]
    token.x = 50
    token.y = 50
    token.hitArea = new Circle(portrait.x, portrait.y + halfSize, halfSize)
    app.stage.addChild(token)

    // add name
    const name = new Text({ text: character.name, style: { fill: 0xFFFFFF, fontSize: 14 } })
    name.anchor.set(0.5, 0)
    name.y = tokenSize
    token.addChild(name)

    // interaction
    token.eventMode = 'static'
    token.cursor = 'pointer'
    token.on('pointerdown', onDragStart, token)
  }

  function onDragMove (event) {
    if (dragTarget) { dragTarget.parent.toLocal(event.global, null, dragTarget.position) }
  }

  function onDragStart () {
    dragTarget = this
    dragTarget.alpha = 0.5
    app.stage.on('pointermove', onDragMove)
  }

  function onDragEnd () {
    if (dragTarget) {
      app.stage.off('pointermove', onDragMove)
      dragTarget.alpha = 1
      console.log(dragTarget.x, dragTarget.y)
      dragTarget = null
    }
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
      display: flex;
      justify-content: center;
    }

  .tools {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 40px;
    gap: 10px;
  }
</style>
