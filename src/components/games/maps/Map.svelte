<script>
  import { onMount, onDestroy } from 'svelte'
  import { getImageUrl } from '@lib/database'
  import { tooltip } from '@lib/tooltip'
  import { Application, Container, Sprite, Assets, Graphics, Texture } from 'pixi.js'
  import { clearCharacter, toggleActive, updateMapDescription, saveTransfrom, saveProposition, clearProposition } from '@lib/map/db'
  import { Character } from '@lib/map/character'
  import { Buttons } from '@lib/map/buttons'
  // import { FoW } from '@lib/map/fow'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let map
  export let game
  export let onDeleteMap
  export let isStoryteller = false

  let mapUrl = ''
  let mapEl, mapWrapperEl, scaledWidth, scaledHeight
  let app, scene, mapSprite, mapTexture
  let availableCharacters = []
  // let fps = 0
  const tokenDiameter = 50

  onMount(async () => {
    app = new Application()
    app.user = user
    app.isStoryteller = isStoryteller

    // to render every frame, set autoStart to true. other options: { backgroundAlpha: 0, resizeTo: mapEl, autoDensity: true, antialias: true, width: mapEl.clientWidth, height: mapEl.clientHeight }
    await app.init({ autoStart: false, resolution: window.devicePixelRatio, autoDensity: true, antialias: true })
    // globalThis.__PIXI_APP__ = app // for chrome plugin

    // add map background image
    mapEl.appendChild(app.canvas)
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
    resize()

    // draw propositions
    app.propositions = new Graphics({ label: 'propositionLines' })
    app.currentProposition = new Graphics({ label: 'currentProposition' })
    scene.addChild(app.propositions)
    scene.addChild(app.currentProposition)
    renderPropositions()

    // fog of war
    // app.fow = new FoW({ map, scene, app })

    // token buttons
    addButtons()

    // add character tokens
    game.characters.forEach(character => { if (!character.storyteller && character.accepted && !map.characters[character.id]) { availableCharacters.push(character) } })
    for (const id of Object.keys(map.characters)) {
      await addCharacter(id, map.characters[id])
    }

    window.addEventListener('resize', resize)
    // app.ticker.add((time) => { fps = Math.round(app.ticker.FPS) })
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  })

  onDestroy(() => { window.removeEventListener('resize', resize) })

  function onDragEnd (event) {
    setTimeout(() => { app.ticker.stop() }, 100)
    if (app.dragging) {
      app.stage.off('pointermove', this.onDragMove)
      app.dragging.token.alpha = 1
      const moveX = Math.abs(app.dragging.token.startGlobal.x - event.data.global.x)
      const moveY = Math.abs(app.dragging.token.startGlobal.y - event.data.global.y)

      if (moveX <= 2 && moveY <= 2) { // token clicked
        app.dragging.select()
      } else { // drag ended
        if (isStoryteller) {
          saveTransfrom(map, app.dragging.characterData, app.dragging.token.x, app.dragging.token.y, app.dragging.token.transform.scale)
        } else {
          saveProposition(map, app.dragging.characterData, app.dragging.token.x, app.dragging.token.y)
          app.dragging.token.x = app.dragging.token.start.x
          app.dragging.token.y = app.dragging.token.start.y
        }
      }
      delete app.dragging
    }
  }

  function resize () {
    if (!mapEl) return
    const scale = Math.min((mapEl.offsetWidth / window.devicePixelRatio) / mapTexture.width, 1)
    scaledWidth = mapTexture.width * scale * window.devicePixelRatio
    scaledHeight = mapTexture.height * scale * window.devicePixelRatio
    // scene.scale.set(scale, scale) // not needed
    scene.width = scaledWidth
    scene.height = scaledHeight
    app.renderer.resize(scaledWidth, scaledHeight)
    mapWrapperEl.style.height = `${scaledHeight}px`
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }

  function renderPropositions () {
    app.propositions.clear()
    for (const id of Object.keys(map.propositions)) {
      const proposition = map.propositions[id]
      const from = map.characters[id]
      if (from) {
        app.propositions.moveTo(from.x, from.y)
        app.propositions.lineTo(proposition.x, proposition.y)
        app.propositions.stroke({ width: 4, color: 0xffffff })
      }
    }
  }

  async function addCharacter (id, transform) {
    availableCharacters = availableCharacters.filter(c => c.id !== id)
    const characterData = game.characters.find(c => c.id === id)
    const texture = characterData.portraitUrl ? await Assets.load({ src: characterData.portraitUrl, loadParser: 'loadTextures' }) : Texture.WHITE
    const character = new Character({ app, map, scene, transform, characterData, texture, tokenDiameter })
    scene.addChild(character.token)
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }

  async function addButtons () {
    await Assets.load(['/maps/button-done.png', '/maps/button-close.png', '/maps/button-plus.png', '/maps/button-minus.png'])
    app.buttons = new Buttons({ app, removeCharacter, removeProposition, tokenDiameter, changeTokenScale, changeAllTokenScale })
  }

  function removeCharacter (token) {
    availableCharacters = [...availableCharacters, token.character.characterData]
    scene.removeChild(token)
    clearCharacter(map, token.character.characterData)
    removeProposition(token)
    renderPropositions()
    app.buttons.contextual.visible = false
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }

  function removeProposition (token) {
    delete map.propositions[token.character.characterData.id]
    clearProposition(map, token.character.characterData.id)
    renderPropositions()
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }

  function deselectAll (event) {
    event.data.originalEvent.preventDefault()
    if (app.selectedToken) {
      app.selectedToken.selectedCircle.visible = false
      app.selectedToken = null
    }
    app.buttons.contextual.visible = false
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }

  function changeTokenScale (token, delta) {
    token.transform.scale += delta
    if (token.transform.scale < 0.1) { return }
    token.scale.x = token.scaleBackup.x * token.transform.scale
    token.scale.y = token.scaleBackup.y * token.transform.scale
    saveTransfrom(map, token.character.characterData, token.x, token.y, token.transform.scale)
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }

  function changeAllTokenScale (delta) {
    scene.children.forEach(child => {
      if (child.label === 'character') {
        changeTokenScale(child, delta)
      }
    })
  }
</script>

<div class='wrapper' bind:this={mapWrapperEl}>
  <!--{#if app && app.renderer}<div id='fps'>{optimized ? fps : 0} fps</div>{/if}-->
  <div id='map' bind:this={mapEl}></div>
</div>

{#if isStoryteller}
  <div id='tools'>
    {#if availableCharacters.length}
      <h3>Přidat postavu</h3>
      <div class='characters'>
        {#each availableCharacters as character}
          <button class='plain character' style="--color: {character.color}" on:click={() => { addCharacter(character.id, { x: scaledWidth / 2, y: scaledHeight / 2 }) }}>
            {#if character.portraitUrl}
              <img class='portrait' src={character.portraitUrl} alt={character.name} />
            {:else}
              <span class='empty'></span>
            {/if}
            <span class='name'>{character.name}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<br><br>
<EditableLong onSave={updateMapDescription} canEdit={isStoryteller} userId={user.id} value={map.description} allowHtml />

{#if isStoryteller}
  <td class='options row'>
    {#if map.isActive}
      <button type='button' on:click={() => { toggleActive(map, game) }}>Deaktivovat</button>
    {:else}
      <button type='button' on:click={() => { toggleActive(map, game) }} title='Nastaví mapu jako aktuální prostředí pro všechny postavy. Otevře se hráčům sama.' use:tooltip>Aktivovat</button>
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
        margin-top: -15px;
        font-size: 15px;
        color: white;
        -webkit-text-stroke: 3px black;
        paint-order: stroke fill;
        width: 60px;
        line-height: 80%;
      }

  .options {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 40px;
    gap: 10px;
  }
  /* #fps {
    position: absolute;
    top: -40px;
    right: 0px;
    text-align: right;
  }*/
</style>
