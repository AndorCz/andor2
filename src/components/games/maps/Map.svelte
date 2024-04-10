<script>
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError, getImageUrl, getPortraitUrl } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import { tooltip } from '@lib/tooltip'
  import { MaskContainer } from '@lib/pixi'
  import { Application, Container, Circle, Sprite, Assets, Graphics, Text } from 'pixi.js'
  import { DropShadowFilter } from 'pixi-filters'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let map
  export let game
  export let user
  export let onDeleteMap
  export let isStoryteller = false

  let mapUrl = ''
  let mapEl, mapWrapperEl
  let app, scene, mapSprite, mapTexture
  let scaledWidth, scaledHeight, dragTarget
  let availableCharacters = []
  let tokenDiameter = 50

  onMount(async () => {
    // prepare map data
    mapUrl = getImageUrl(`${game.id}/${map.id}?${map.image}`, 'maps')
    game.characters.forEach(character => { if (!map.characters[character.id]) { availableCharacters.push(character) } })

    app = new Application()
    await app.init({ resolution: window.devicePixelRatio }) // { backgroundAlpha: 0, resizeTo: mapEl, autoDensity: true }
    mapEl.appendChild(app.canvas)
    // globalThis.__PIXI_APP__ = app // for chrome plugin

    // add map background image
    mapTexture = await Assets.load({ src: mapUrl, loadParser: 'loadTextures' })
    mapSprite = new Sprite(mapTexture)
    mapSprite.label = 'map'
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage.on('pointerup', onDragEnd)
    app.stage.on('pointerupoutside', onDragEnd)

    scene = new Container({ x: 0, y: 0, width: app.screen.width, height: app.screen.height })
    app.stage.addChild(scene)
    scene.addChild(mapSprite)

    // add character tokens
    for (const id of Object.keys(map.characters)) {
      await addCharacter(id, map.characters[id])
    }
    resize()
    window.addEventListener('resize', resize)
  })

  onDestroy(() => { window.removeEventListener('resize', resize) })

  function resize () {
    if (!mapEl) return
    const scale = Math.min(mapEl.offsetWidth / mapTexture.width, 1)
    scaledWidth = mapTexture.width * scale
    scaledHeight = mapTexture.height * scale
    // scene.scale.set(scale, scale) // not needed?
    scene.width = scaledWidth
    scene.height = scaledHeight
    app.renderer.resize(scaledWidth, scaledHeight)
    mapWrapperEl.style.height = `${scaledHeight}px`
  }

  async function addCharacter (id, transform) {
    availableCharacters = availableCharacters.filter(c => c.id !== id)
    const characterData = game.characters.find(c => c.id === id)
    const texture = await Assets.load({ src: characterData.portraitUrl, loadParser: 'loadTextures' })
    const portrait = new Sprite(texture)
    const scale = Math.max(tokenDiameter / portrait.width, tokenDiameter / portrait.height)
    portrait.scale.set(scale)
    portrait.anchor.set(0.5, 0)

    // circle mask
    const tokenRadius = tokenDiameter / 2
    const token = new MaskContainer() // workaround for missing pixi.js feature (interaction on masked sprites)
    const mask = new Graphics().circle(portrait.x, portrait.y, tokenRadius).fill('#fff')
    portrait.mask = mask
    mask.pivot.y = -tokenRadius // show head of the character
    token.pivot.y = tokenRadius // counteract the mask pivot
    token.label = 'character'
    token.character = characterData
    token.addChild(mask)
    token.addChild(portrait)
    token.filters = [new DropShadowFilter()]
    token.x = transform.x
    token.y = transform.y
    token.hitArea = new Circle(portrait.x, portrait.y + tokenRadius, tokenRadius)
    scene.addChild(token)

    // add name
    const name = new Text({ text: characterData.name, style: { fontSize: 14, fontFamily: 'Alegreya Sans', fill: '#fff', fontWeight: 'bold', stroke: { color: '#000', width: 5 } } })
    name.anchor.set(0.5, 0.5)
    name.y = tokenDiameter
    token.addChild(name)

    // add interaction
    token.eventMode = 'static'
    token.cursor = 'pointer'
    token.on('pointerdown', onDragStart, token)
  }

  // interactions

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
      if (isStoryteller) {
        savePosition(dragTarget.character, dragTarget.x, dragTarget.y)
      } else {
        saveProposition(dragTarget.character, dragTarget.x, dragTarget.y)
      }
      dragTarget = null
    }
  }

  // database operations

  async function savePosition (character, x, y) {
    const newPositions = { ...map.characters, [character.id]: { x, y } }
    const { error } = await supabase.from('maps').update({ characters: newPositions }).eq('id', map.id)
    if (error) { handleError(error) }
  }

  async function saveProposition (character, x, y) {
    const newPropositions = { ...map.propositions, [character.id]: { x, y } }
    const { error } = await supabase.from('maps').update({ propositions: newPropositions }).eq('id', map.id)
    if (error) { handleError(error) }
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
<div id='tools'>
  <h3>Přidat postavu</h3>
  <div class='characters'>
    {#each availableCharacters as character}
      <button class='plain character' on:click={() => { addCharacter(character.id, { x: scaledWidth / 2, y: scaledHeight / 2 }) }}>
        <img src={getPortraitUrl(character.id, character.portrait)} alt={character.name} />
        <span class='name'>{character.name}</span>
      </button>
    {/each}
  </div>
</div>
<br><br>
<EditableLong onSave={updateMapDescription} canEdit={isStoryteller} userId={user.id} value={map.description} allowHtml />
{#if isStoryteller}
  <td class='options row'>
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

  .characters {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    margin-top: 20px;
  }
    .character {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
      .character:hover {
        transform: scale(1.1);
      }
      .character img {
        display: block;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        object-position: center 20%;
      }
      .character .name {
        margin-top: -10px;
        font-size: 14px;
        color: white;
        -webkit-text-stroke: 3px black;
        paint-order: stroke fill;
      }

  .options {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 40px;
    gap: 10px;
  }
</style>
