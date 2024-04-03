<script>
  import { onMount } from 'svelte'
  import { showError, showSuccess } from '@lib/toasts'
  import DiceBox from '@3d-dice/dice-box-threejs'
  import CharacterSelect from '@components/games/characters/CharacterSelect.svelte'

  export let threadId
  export let gameStore
  export let activeAudienceIds
  export let onRoll
  export let onAudienceSelect
  export let myCharacters
  export let otherCharacters

  let diceBox
  let notation = ''

  const defaults = { k4: 0, k6: 0, k8: 0, k10: 0, k12: 0, k20: 0, k100: 0 }
  $gameStore.dice = $gameStore.dice || defaults

  onMount(() => {
    diceBox = new DiceBox('#diceBox', { sounds: true, assetPath: '/dice/' })
    diceBox.initialize()
  })

  async function showRoll () {
    // convert into czech dice notation (eg. '2k4,3k6,1k20,2k10')
    const diceNotation = Object.entries($gameStore.dice).filter(([key, value]) => value > 0).map(([key, value]) => `${value}${key}`).join(',')
    if (diceNotation) {
      // rolls are happening on the server
      const audience = $activeAudienceIds.includes('*') ? null : $activeAudienceIds // clean '*' from audience
      const res = await fetch(`/api/game/roll?thread=${threadId}&dice=${encodeURIComponent(diceNotation)}&owner=${$gameStore.activeCharacterId}&audience=${encodeURIComponent(JSON.stringify(audience))}`, { method: 'GET' })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
      json.results = json.results.replaceAll('k', 'd') // convert to english dice notation for dice-box
      await diceBox.roll(json.results)
      onRoll()
    } else {
      showError('Nemáš vybrané žádné kostky')
    }
  }

  function parseNotation (event) {
    const dicePattern = /(\d+)(k\d+)/g
    let match
    const newDiceValues = { ...defaults }

    while ((match = dicePattern.exec(event.target.value)) !== null) {
      const [, count, diceType] = match
      if (diceType in newDiceValues) {
        newDiceValues[diceType] = parseInt(count, 10)
      }
    }

    Object.keys($gameStore.dice).forEach(type => { $gameStore.dice[type] = newDiceValues[type] })
  }

  function addDice (type) { if ($gameStore.dice[type] < 50) { $gameStore.dice[type]++ } }
  function subDice (type) { if ($gameStore.dice[type] > 0) { $gameStore.dice[type]-- } }
  function clearDice (type) { $gameStore.dice[type] = 0 }
  function copyNotation () {
    navigator.clipboard.writeText(notation)
    showSuccess('Kostky byly zkopírovány do schránky')
  }

  // sanitize dice values
  $: { Object.keys($gameStore.dice).forEach(type => { $gameStore.dice[type] = Number($gameStore.dice[type].toString().replace(/[^0-9]/g, '')) }) }

  // parse dice values into dice notation
  $: { if ($gameStore) { notation = Object.entries($gameStore.dice).filter(([key, value]) => value > 0).map(([key, value]) => `${value}${key}`).join(',') } }
</script>

<div class='wrapper'>
  <div id='diceBox'></div>
  <div class='tools'>
    <div class='die'>
      <button on:click={() => { clearDice('k4') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('k4') }} class='addLarge k4'>k4</button>
      <input type='text' bind:value={$gameStore.dice.k4} maxlength='2' class='count' />
      <button on:click={() => { subDice('k4') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('k4') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('k6') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('k6') }} class='addLarge k6'>k6</button>
      <input type='text' bind:value={$gameStore.dice.k6} maxlength='2' class='count' />
      <button on:click={() => { subDice('k6') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('k6') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('k8') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('k8') }} class='addLarge k8'>k8</button>
      <input type='text' bind:value={$gameStore.dice.k8} maxlength='2' class='count' />
      <button on:click={() => { subDice('k8') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('k8') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('k10') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('k10') }} class='addLarge k10'>k10</button>
      <input type='text' bind:value={$gameStore.dice.k10} maxlength='2' class='count' />
      <button on:click={() => { subDice('k10') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('k10') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('k12') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('k12') }} class='addLarge k12'>k12</button>
      <input type='text' bind:value={$gameStore.dice.k12} maxlength='2' class='count' />
      <button on:click={() => { subDice('k12') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('k12') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('k20') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('k20') }} class='addLarge k20'>k20</button>
      <input type='text' bind:value={$gameStore.dice.k20} maxlength='2' class='count' />
      <button on:click={() => { subDice('k20') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('k20') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('k100') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('k100') }} class='addLarge k10'>k100</button>
      <input type='text' bind:value={$gameStore.dice.k100} maxlength='2' class='count' />
      <button on:click={() => { subDice('k100') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('k100') }} class='add material'>add</button>
    </div>
  </div>

  <CharacterSelect as={'Hodit za'} to={'Hod se zobrazí'} {onAudienceSelect} {myCharacters} {otherCharacters} {activeAudienceIds} {gameStore} />

  <div class='row'>
    <div class='notation'>
      <input type='text' value={notation} on:input={parseNotation} size='48' />
      <button on:click={copyNotation} class='copy material plain'>content_copy</button>
    </div>
    <button on:click={showRoll} class='roll'>Hodit kostky</button>
  </div>
</div>

<style>
  .wrapper {
    position: relative;
  }
    .tools {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 10px;
      padding-bottom: 10px;
      gap: 10px;
    }
      .die {
        flex: 1;
        position: relative;
        background-color: var(--block);
        border-radius: 10px;
        text-align: center;
      }
        .addLarge {
          position: absolute;
          left: 50%;
          top: -60px;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          margin-top: 0px;
          box-shadow: none;
          text-shadow: 1px 1px 6px #0005;
          width: 70px;
          height: 70px;
          background-size: contain;
          background-repeat: no-repeat;
          font-size: 2rem;
          transform: translateX(-50%);
          transform-origin: 50% 50%;
        }
          .addLarge:hover {
            transform: translateX(-50%) scale(1.1);
          }
          .add:hover, .sub:hover, .clear:hover {
            transform: scale(1.1);
          }
        .clear, .sub, .add {
          position: absolute;
          padding: 5px;
          font-size: 1.2rem;
          color: var(--dim);
        }
        .add {
          border-radius: 0px 10px 0px 10px;
          top: 0px;
          right: 0px;
        }
        .sub {
          border-radius: 10px 0px 10px 0px;
          bottom: 0px;
          right: 0px;
        }
        .clear {
          border-radius: 0px 10px 0px 10px;
          bottom: 0px;
          left: 0px;
        }
        .count {
          text-align: center;
          font-weight: bold;
          width: 50%;
          font-family: var(--font);
          background: none;
          color: var(--text);
          padding-bottom: 10px;
          font-size: 2.5rem;
          appearance: none;
          padding: 10px 5px;
          display: block;
          margin: auto;
        }
        button.k4 {
          background-image: url('/dice/k4.png');
        }
        button.k6 {
          background-image: url('/dice/k6.png');
        }
        button.k8 {
          background-image: url('/dice/k8.png');
        }
        button.k10 {
          background-image: url('/dice/k10.png');
        }
        button.k12 {
          background-image: url('/dice/k12.png');
        }
        button.k12 {
          background-image: url('/dice/k12.png');
        }
        button.k20 {
          background-image: url('/dice/k20.png');
        }
    #diceBox {
      width: 100%;
      height: 400px;
      background: url('/feld.jpg');
    }
    .row {
      padding: 20px 0px;
      display: flex;
      justify-content: space-between;
    }
    .notation {
      position: relative;
    }
      .notation input {
        width: 100%;
      }
      .copy {
        position: absolute;
        top: 15px;
        right: 15px;
      }

  @media (max-width: 860px) {
    .tools {
      flex-wrap: wrap;
    }
  }
</style>
