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
  let app, scene, mapSprite, mapTexture, tokenButtons
  let scaledWidth, scaledHeight, dragTarget, selectedToken
  let availableCharacters = []
  let tokenDiameter = 50

  onMount(async () => {
    app = new Application()
    await app.init({ resolution: window.devicePixelRatio }) // { backgroundAlpha: 0, resizeTo: mapEl, autoDensity: true, antialias: true }
    mapEl.appendChild(app.canvas)
    // globalThis.__PIXI_APP__ = app // for chrome plugin

    // add map background image
    mapUrl = getImageUrl(`${game.id}/${map.id}?${map.image}`, 'maps')
    mapTexture = await Assets.load({ src: mapUrl, loadParser: 'loadTextures' })
    mapSprite = new Sprite(mapTexture)
    mapSprite.label = 'map'
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      // .on('click', deselect)

    scene = new Container({ x: 0, y: 0, width: app.screen.width, height: app.screen.height })
    app.stage.addChild(scene)
    scene.addChild(mapSprite)

    // token buttons
    await Assets.load(['/maps/button-close.png'])
    addTokenButtons()

    // add character tokens
    game.characters.forEach(character => { if (!map.characters[character.id]) { availableCharacters.push(character) } })
    for (const id of Object.keys(map.characters)) {
      await addCharacterToken(id, map.characters[id])
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
    const selectedCircle = new Graphics().circle(portrait.x, portrait.y, tokenRadius + 2).stroke({ width: 3, color: 0xffffff })
    selectedCircle.pivot.y = -tokenRadius
    selectedCircle.visible = false
    token.selectedCircle = selectedCircle
    token.addChild(selectedCircle)

    // add name
    const name = new Text({ text: characterData.name, style: { fontSize: 14, fontFamily: 'Alegreya Sans', fill: '#fff', fontWeight: 'bold', stroke: { color: '#000', width: 5 } } })
    name.anchor.set(0.5, 0.5)
    name.y = tokenDiameter
    token.addChild(name)

    // add interaction
    token.eventMode = 'static'
    token.cursor = 'pointer'
    token.on('pointerdown', onTokenDown, token)
  }

  function addTokenButtons () {
    tokenButtons = new Container()
    app.stage.addChild(tokenButtons)

    // remove token button
    const close = Sprite.from('/maps/button-close.png')
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
  }

  // interactions

  function onTokenDown (event) {
    event.data.originalEvent.preventDefault()
    if (selectedToken) { selectedToken.selectedCircle.visible = false } // deselect previous token
    dragTarget = this
    dragTarget.alpha = 0.5
    dragTarget.data = event.data
    dragTarget.start = { x: event.data.global.x, y: event.data.global.y }
    app.stage.on('pointermove', onDragMove)
  }

  function onDragMove (event) {
    if (dragTarget) { dragTarget.parent.toLocal(event.global, null, dragTarget.position) }
  }

  function onDragEnd (event) {
    if (dragTarget) {
      app.stage.off('pointermove', onDragMove)
      dragTarget.alpha = 1
      const moveX = Math.abs(dragTarget.start.x - event.data.global.x)
      const moveY = Math.abs(dragTarget.start.y - event.data.global.y)

      if (moveX <= 2 && moveY <= 2) { // token clicked
        console.log('token clicked')
        selectedToken = dragTarget
        dragTarget.selectedCircle.visible = true
        tokenButtons.visible = true
        tokenButtons.position.set(dragTarget.x, dragTarget.y - tokenDiameter)
      } else { // drag ended
        console.log('drag ended')
        if (isStoryteller) {
          savePosition(dragTarget.character, dragTarget.x, dragTarget.y)
        } else {
          saveProposition(dragTarget.character, dragTarget.x, dragTarget.y)
        }
      }
      dragTarget = null
    }
  }

  function deselect (event) {
    event.data.originalEvent.preventDefault()
    console.log('deselect')
    if (dragTarget) {
      dragTarget.selectedCircle = false
      dragTarget = null
    }
    tokenButtons.visible = false
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
