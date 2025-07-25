<script>
  import { Vtt } from '@lib/map/vtt'
  import { tooltip } from '@lib/tooltip'
  import { Character } from '@lib/map/character'
  import { showSuccess } from '@lib/toasts'
  import { onMount, onDestroy } from 'svelte'
  import { getCanvasCoordinates } from '@lib/map/utils'
  import { stringToColor, getStamp } from '@lib/utils'
  import { supabase, handleError } from '@lib/database-browser'
  import { clearCharacter, saveTransfrom } from '@lib/map/db'
  import EditableLong from '@components/common/EditableLong.svelte'

  let { user, map = $bindable(), game, onDeleteMap, isStoryteller = false } = $props()

  let vtt = $state()
  let mapEl = $state()
  let mapWrapperEl = $state()
  let availableCharacters = $state([])
  let fowEnabled = $state(map.fow)
  let fowChanged = $state(false)
  let tool = $state('select')
  let npcTokenName = $state('')
  let isPinned = $state(map.isActive)

  const tokenDiameter = 50

  onMount(async () => {
    mapEl.addEventListener('dragover', (event) => event.preventDefault())
    mapEl.addEventListener('drop', handleDrop)

    game.characters.forEach(character => {
      if (!character.storyteller && character.accepted && !map.characters[character.id] && character.state === 'alive') {
        availableCharacters.push(character)
      }
    })

    vtt = new Vtt({ map, game, user, isStoryteller, mapEl, mapWrapperEl, renderCharacter, removeCharacter, tokenDiameter, onFowChange })
    await vtt.init()
  })

  onDestroy(() => { vtt.destroy() })

  export async function updateDescription (description) {
    const { error } = await supabase.from('maps').update({ description }).eq('id', map.id)
    if (error) { handleError(error) }
    showSuccess('Popis mapy byl upraven')
  }

  async function renderCharacter (characterData, transform) {
    const character = new Character({ app: vtt.app, scene: vtt.scene, map, transform, characterData, tokenDiameter })
    await character.init()
    vtt.scene.addChild(character.token)
    if (!vtt.app.ticker.started) { vtt.app.renderer.render(vtt.app.stage) }
  }

  function addCharacter (characterData, transform, player = true) {
    if (player) { availableCharacters = availableCharacters.filter(c => c.id !== characterData.id) }
    renderCharacter(characterData, transform)
    map.characters[characterData.id] = transform
    saveTransfrom(map, characterData, transform.x, transform.y, 1)
  }

  function removeCharacter (token) {
    if (token.character.characterData.player !== 'npc') { availableCharacters = [...availableCharacters, token.character.characterData] }
    vtt.scene.removeChild(token)
    delete map.characters[token.character.characterData.id]
    clearCharacter(map, token.character.characterData)
    vtt.removeProposition(token)
    vtt.renderPropositions()
    vtt.app.buttons.contextual.visible = false
    if (!vtt.app.ticker.started) { vtt.app.renderer.render(vtt.app.stage) }
  }

  function handleDragStart (event, character) {
    const target = event.currentTarget
    if (event.dataTransfer.setDragImage) { event.dataTransfer.setDragImage(target, target.offsetWidth / 2, target.offsetHeight / 2) }
    const characterData = JSON.stringify({ id: character.id, portraitUrl: character.portraitUrl, name: character.name })
    event.dataTransfer.setData('application/json', characterData)
  }

  function handleDrop (event) {
    event.preventDefault()
    const characterData = JSON.parse(event.dataTransfer.getData('application/json'))
    const position = getCanvasCoordinates(event, vtt, mapEl)
    const transform = { x: position.x, y: position.y, scale: 1 }
    addCharacter(characterData, transform, true)
  }

  function addNpc () {
    const name = npcTokenName.trim().replace(/["\\]/g, '')
    if (!name) { return }
    addCharacter({ id: name, name, player: 'npc' }, { x: vtt.scaledWidth / 2, y: vtt.scaledHeight / 2, scale: 1 }, false)
    npcTokenName = ''
  }

  async function toggleActive (map, game) {
    const { error } = await supabase.from('games').update({ active_map: map.isActive ? null : map.id }).eq('id', game.id)
    if (error) { return handleError(error) }
    map.isActive = !map.isActive
    isPinned = map.isActive
    return showSuccess(map.isActive ? 'Mapa byla připnuta, zobrazí se všem hráčům' : 'Připnutí mapy bylo zrušeno')
  }

  function changeTool (newTool) {
    tool = newTool
    vtt.fow.changeTool(newTool)
  }

  function onFowChange () { fowChanged = true }

  function enableFow () {
    map.fow = fowEnabled = true
    tool = 'light'
    vtt.enableFog()
  }

  function disableFow () {
    map.fow = fowEnabled = false
    vtt.disableFog()
  }

  function saveFog () {
    vtt.fow.save()
    map.fow_image = getStamp()
    fowChanged = false
  }
</script>

<div class='wrapper' bind:this={mapWrapperEl}>
  {#if vtt && isStoryteller}
    <div class='controls'>
      <div class='fow'>
        {#if fowEnabled}
          <span>
            <button type='button' onclick={() => { changeTool('select') }} class:active={tool === 'select'} class='material round' title='Výběr a pohyb' use:tooltip>arrow_selector_tool</button>
            <button type='button' onclick={() => { changeTool('light') }} class:active={tool === 'light'} class='material round' title='Kreslit světlo' use:tooltip>light_mode</button>
            <button type='button' onclick={() => { changeTool('dark') }} class:active={tool === 'dark'} class='material round' title='Kreslit tmu' use:tooltip>mode_night</button>
          </span>
          <button type='button' onclick={disableFow} class='material square' title='Vypnout mlhu viditelnosti' use:tooltip>visibility_off</button>
          {#if fowChanged}
            <button type='button' onclick={() => { saveFog() }} class='material square save' title='Uložit viditelnost' use:tooltip>check</button>
          {/if}
          {#if tool === 'light' || tool === 'dark'}
            <div class='brush'>
              <button type='button' onclick={() => { vtt.fow.changeBrushSize(0.5) }} class='material round' title='Zmenšit okruh' use:tooltip>fiber_manual_record</button>
              <button type='button' onclick={() => { vtt.fow.changeBrushSize(2) }} class='material round' title='Zvětšit okruh' use:tooltip>circle</button>
            </div>
          {/if}
        {:else}
          <button type='button' onclick={enableFow} class='material square' title='Nakreslit mlhu viditelnosti' use:tooltip>visibility</button>
        {/if}
      </div>
      <div class='scale'>
        <button type='button' onclick={() => { vtt.changeAllTokenScale(-0.2) }} class='material round' title='Zmenšit všechny postavy' use:tooltip>remove</button>
        <button type='button' onclick={() => { vtt.changeAllTokenScale(0.2) }} class='material round' title='Zvětšit všechny postavy' use:tooltip>add</button>
      </div>
    </div>
  {/if}
  <div id='map' bind:this={mapEl}></div>
</div>

{#if isStoryteller}
  <div id='tools'>
    {#if availableCharacters.length}
      <div class='characters'>
        <h3>Přidat postavu</h3>
        <div class='characterList'>
          {#each availableCharacters as character (character.id)}
            <button draggable='true' ondragstart={(event) => handleDragStart(event, character)} class='plain character'>
              {#if character.portraitUrl}
                <img class='portrait' src={character.portraitUrl} alt={character.name} />
              {:else}
                <span class='empty' style="--color: {character.color || stringToColor(character.name)}"></span>
              {/if}
              <span class='name'>{character.name}</span>
            </button>
          {/each}
        </div>
      </div>
      <div class='npcs'>
        <h3>Přidat žeton</h3>
        <div class='row'>
          <input type='text' placeholder='Název' bind:value={npcTokenName} onkeydown={(e) => { if (e.key === 'Enter') { addNpc() } }}>
          <button type='button' onclick={addNpc} class='material square'>add</button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<br><br>
<EditableLong onSave={updateDescription} canEdit={isStoryteller} {user} bind:value={map.description} allowHtml />

{#if isStoryteller}
  <td class='options row'>
    {#if isPinned}
      <button type='button' class='material square active' onclick={() => { toggleActive(map, game) }} title='Zrušit připnutí' use:tooltip>keep_off</button>
    {:else}
      <button type='button' class='material square' onclick={() => { toggleActive(map, game) }} title='Připnout mapu jako aktuální prostředí pro všechny postavy. Otevře se hráčům sama.' use:tooltip>keep</button>
    {/if}
    <a href={`/game/map-form?gameId=${game.id}&mapId=${map.id}`} class='material square button' title='Upravit' use:tooltip>edit</a>
    <button type='button' onclick={() => { onDeleteMap(map.id) }} class='material square' title='Smazat' use:tooltip>delete</button>
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

    .controls {
      position: sticky;
      z-index: 100;
      top: 0px;
    }
      .scale, .fow {
        position: absolute;
        top: 5px;
      }
        .scale {
          left: 5px;
        }
          .scale button {
            margin-right: 5px;
          }

      .fow {
        right: 5px;
      }
        .fow button {
          margin-left: 5px;
        }
        .save {
          background-color: var(--accent);
          color: var(--maximum);
          border: 1px color-mix(in srgb, var(--accent), var(--maximum) 15%) solid;
        }

  .brush {
    position: absolute;
    top: 60px;
    right: 5px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  button:hover {
    transform: scale(1.1);
  }

  #tools {
    display: flex;
  }
    .characters {
      flex: 1;
    }
      .characterList {
        flex: 1;
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

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .options {
    justify-content: center;
    margin-top: 40px;
  }

  @media (max-width: 600px) {
    #tools {
      display: block;
    }
  }
</style>
