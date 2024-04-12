<script>
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError, getImageUrl } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import { tooltip } from '@lib/tooltip'
  import { MaskContainer } from '@lib/pixi'
  import { Application, Container, Circle, Sprite, Assets, Graphics, Text, Texture } from 'pixi.js'
  import { DropShadowFilter } from 'pixi-filters'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let map
  export let game
  export let user
  export let onDeleteMap
  export let isStoryteller = false

  let mapUrl = ''
  let mapEl, mapWrapperEl
  let app, scene, mapSprite, mapTexture, tokenButtons, propositions, currentProposition
  let scaledWidth, scaledHeight, dragTarget, selectedToken
  let availableCharacters = []
  // let fps = 0
  const tokenDiameter = 50
  const optimized = true

  onMount(async () => {
    app = new Application()
    await app.init({ resolution: window.devicePixelRatio, autoDensity: true, antialias: true, autoStart: !optimized }) // { backgroundAlpha: 0, resizeTo: mapEl, autoDensity: true, antialias: true, width: mapEl.clientWidth, height: mapEl.clientHeight }
    mapEl.appendChild(app.canvas)
    // globalThis.__PIXI_APP__ = app // for chrome plugin

    // add map background image
    mapUrl = getImageUrl(`${game.id}/${map.id}?${map.image}`, 'maps')
    mapTexture = await Assets.load({ src: mapUrl, loadParser: 'loadTextures' })
    mapSprite = new Sprite(mapTexture)
    mapSprite.eventMode = 'none'
    mapSprite.label = 'map'

    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointerdown', deselectAll)

    scene = new Container({ x: 0, y: 0, width: app.screen.width, height: app.screen.height })
    scene.label = 'scene'
    app.stage.addChild(scene)
    scene.addChild(mapSprite)

    propositions = new Graphics({ label: 'proposition lines' })
    currentProposition = new Graphics({ label: 'current proposition line' })
    scene.addChild(propositions)
    scene.addChild(currentProposition)

    // token buttons
    const buttonTextures = [
      { alias: 'close', src: '/maps/button-close.png' }
    ]
    await Assets.load(buttonTextures)
    addTokenButtons()

    // add character tokens
    game.characters.forEach(character => { if (!map.characters[character.id]) { availableCharacters.push(character) } })
    for (const id of Object.keys(map.characters)) {
      await addCharacterToken(id, map.characters[id])
    }

    resize()
    window.addEventListener('resize', resize)
    // app.ticker.add((time) => { fps = Math.round(app.ticker.FPS) })
    if (optimized) { app.renderer.render(app.stage) }
  })

  onDestroy(() => {
    window.removeEventListener('resize', resize)
  })

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
    if (optimized) { app.renderer.render(app.stage) }
  }

  async function addCharacterToken (id, transform) {
    availableCharacters = availableCharacters.filter(c => c.id !== id)
    const characterData = game.characters.find(c => c.id === id)
    const texture = characterData.portraitUrl ? await Assets.load({ src: characterData.portraitUrl, loadParser: 'loadTextures' }) : Texture.WHITE
    const portrait = new Sprite(texture)
    if (!characterData.portraitUrl) { portrait.tint = characterData.color }
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

    // selected circle
    const selectedCircle = new Graphics().circle(portrait.x, portrait.y, tokenRadius + 1).stroke({ width: 3, color: 0xffffff })
    selectedCircle.pivot.y = -tokenRadius
    selectedCircle.visible = false
    token.selectedCircle = selectedCircle
    token.addChild(selectedCircle)

    // add name
    const name = new Text({ text: characterData.name, style: { fontSize: 15, fontFamily: 'Alegreya Sans', fill: '#fff', fontWeight: 'bold', stroke: { color: '#000', width: 5 } } })
    name.anchor.set(0.5, 0.7)
    name.y = tokenDiameter
    token.addChild(name)

    // add interaction
    token.eventMode = 'static'
    token.cursor = 'pointer'
    token.on('pointerdown', onTokenPointerDown, token)
    if (optimized) { app.renderer.render(app.stage) }
  }

  function addTokenButtons () {
    tokenButtons = new Container()
    tokenButtons.label = 'tokenButtons'
    app.stage.addChild(tokenButtons)

    // button: remove token
    const close = Sprite.from('close')
    close.anchor.set(0.5, 0.5)
    close.eventMode = 'static'
    close.buttonMode = true
    close.interactive = true
    close.cursor = 'pointer'
    close.on('pointerdown', () => { removeCharacterToken(selectedToken) })

    tokenButtons.visible = false
    tokenButtons.addChild(close)
  }

  function removeCharacterToken (token) {
    availableCharacters = [...availableCharacters, token.character]
    scene.removeChild(token)
    removeCharacter(token.character)
    tokenButtons.visible = false
    if (optimized) { app.renderer.render(app.stage) }
  }

  // interactions

  function onTokenPointerDown (event) {
    if (optimized) { app.ticker.start() }
    event.stopPropagation()
    event.data.originalEvent.preventDefault()
    if (selectedToken) { selectedToken.selectedCircle.visible = false } // deselect previous token
    dragTarget = this
    dragTarget.alpha = 0.5
    dragTarget.data = event.data
    dragTarget.start = { x: dragTarget.x, y: dragTarget.y }
    dragTarget.startGlobal = { x: event.data.global.x, y: event.data.global.y }
    app.stage.on('pointermove', onDragMove)
  }

  function onDragMove (event) {
    if (dragTarget) { dragTarget.parent.toLocal(event.global, null, dragTarget.position) }
    drawProposition(dragTarget.start.x, dragTarget.start.y, dragTarget.x, dragTarget.y)
  }

  function onDragEnd (event) {
    if (optimized) { setTimeout(() => { app.ticker.stop() }, 100) }
    if (dragTarget) {
      app.stage.off('pointermove', onDragMove)
      dragTarget.alpha = 1
      const moveX = Math.abs(dragTarget.startGlobal.x - event.data.global.x)
      const moveY = Math.abs(dragTarget.startGlobal.y - event.data.global.y)

      if (moveX <= 2 && moveY <= 2) { // token clicked
        selectToken(dragTarget)
      } else { // drag ended
        if (isStoryteller) {
          savePosition(dragTarget.character, dragTarget.x, dragTarget.y)
        } else {
          saveProposition(dragTarget.character, dragTarget.x, dragTarget.y)
        }
      }
      dragTarget = null
    }
  }

  function drawProposition (fromX, fromY, toX, toY) {
    currentProposition.clear()
    currentProposition.moveTo(fromX, fromY)
    currentProposition.lineTo(toX, toY)
    currentProposition.stroke({ width: 4, color: 0xffffff })
  }

  function selectToken (token) {
    if (selectedToken) { selectedToken.selectedCircle.visible = false }
    selectedToken = token
    token.selectedCircle.visible = true
    tokenButtons.visible = true
    const { x, y } = token.getGlobalPosition()
    tokenButtons.position.set(x, y - tokenDiameter)
    if (optimized) { app.renderer.render(app.stage) }
  }

  function deselectAll (event) {
    event.data.originalEvent.preventDefault()
    if (selectedToken) {
      selectedToken.selectedCircle.visible = false
      selectedToken = null
    }
    tokenButtons.visible = false
    if (optimized) { app.renderer.render(app.stage) }
  }

  // database operations

  async function savePosition (character, x, y) {
    const newPositions = { ...map.characters, [character.id]: { x, y } }
    const { error } = await supabase.from('maps').update({ characters: newPositions }).eq('id', map.id)
    if (error) { handleError(error) }
  }

  async function removeCharacter (character) {
    const newPositions = { ...map.characters }
    delete newPositions[character.id]
    const newPropositions = { ...map.propositions }
    delete newPropositions[character.id]
    const { error } = await supabase.from('maps').update({ characters: newPositions, propositions: newPropositions }).eq('id', map.id)
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
  <!--{#if app && app.renderer}<div id='fps'>{optimized ? fps : 0} fps</div>{/if}-->
  <div id='map' bind:this={mapEl}></div>
</div>
<div id='tools'>
  <h3>Přidat postavu</h3>
  <div class='characters'>
    {#each availableCharacters as character}
      <button class='plain character' style="--color: {character.color}" on:click={() => { addCharacterToken(character.id, { x: scaledWidth / 2, y: scaledHeight / 2 }) }}>
        {#if character.portraitUrl}
          <img class='portrait' src={character.portraitUrl} alt={character.name} />
        {:else}
          <span class='empty'></span>
        {/if}
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
    /*
    #fps {
      position: absolute;
      top: -40px;
      right: 0px;
      text-align: right;
    }
    */
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
      .portrait, .empty {
        display: block;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        object-position: center 20%;
        background-color: var(--color);
      }
      .name {
        margin-top: -15px;
        font-size: 15px;
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
