<script>
  import { onMount, onDestroy } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { Assets, Texture } from 'pixi.js'
  import { clearCharacter, toggleActive, updateMapDescription, saveTransfrom } from '@lib/map/db'
  import { Vtt } from '@lib/map/vtt'
  import { Character } from '@lib/map/character'
  import { getCanvasCoordinates } from '@lib/map/utils'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let map
  export let game
  export let onDeleteMap
  export let isStoryteller = false

  let mapEl, mapWrapperEl, vtt
  let availableCharacters = []
  // let fps = 0
  const tokenDiameter = 50

  onMount(async () => {
    mapEl.addEventListener('dragover', (event) => event.preventDefault())
    mapEl.addEventListener('drop', handleDrop)

    console.log('map.characters', map.characters)
    console.log('print map.characters names from game.characters', game.characters.filter(c => map.characters[c.id]).map(c => c.name))
    console.log('availableCharacters', game.characters)
    game.characters.forEach(character => {
      if (!character.storyteller && character.accepted && !map.characters[character.id]) {
        availableCharacters.push(character)
      }
    })

    vtt = new Vtt({ map, game, user, isStoryteller, mapEl, mapWrapperEl, renderCharacter, removeCharacter, tokenDiameter })
    await vtt.init()
  })

  onDestroy(() => { vtt.destroy() })

  async function renderCharacter (id, transform) {
    availableCharacters = availableCharacters.filter(c => c.id !== id)
    const characterData = game.characters.find(c => c.id === id)
    console.log('adding character:', id, characterData.name)
    const texture = characterData.portraitUrl ? await Assets.load({ src: characterData.portraitUrl, loadParser: 'loadTextures' }) : Texture.WHITE
    const character = new Character({ app: vtt.app, scene: vtt.scene, map, transform, characterData, texture, tokenDiameter })
    vtt.scene.addChild(character.token)
    if (!vtt.app.ticker.started) { vtt.app.renderer.render(vtt.app.stage) }
  }

  function removeCharacter (token) {
    availableCharacters = [...availableCharacters, token.character.characterData]
    vtt.scene.removeChild(token)
    clearCharacter(map, token.character.characterData)
    vtt.removeProposition(token)
    vtt.renderPropositions()
    vtt.app.buttons.contextual.visible = false
    if (!vtt.app.ticker.started) { vtt.app.renderer.render(vtt.app.stage) }
  }

  function handleDragStart (event, character) {
    const target = event.currentTarget
    if (event.dataTransfer.setDragImage) { event.dataTransfer.setDragImage(target, target.offsetWidth / 2, target.offsetHeight / 2) }

    const characterData = JSON.stringify({
      id: character.id,
      portraitUrl: character.portraitUrl,
      name: character.name
    })
    event.dataTransfer.setData('application/json', characterData)
  }

  function handleDrop (event) {
    event.preventDefault()
    const characterData = JSON.parse(event.dataTransfer.getData('application/json'))
    const position = getCanvasCoordinates(event, vtt, mapEl)
    const transform = { x: position.x, y: position.y, scale: 1 }
    renderCharacter(characterData.id, transform)
    map.characters[characterData.id] = transform
    saveTransfrom(map, characterData, position.x, position.y, 1)
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
          <button draggable='true' on:dragstart={(event) => handleDragStart(event, character)} class='plain character' style="--color: {character.color}"><!-- on:click={() => { addCharacter(character.id, { x: vtt.scaledWidth / 2, y: vtt.scaledHeight / 2 }) }} -->
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
