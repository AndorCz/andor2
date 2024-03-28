<script>
  import DiceBox from '@3d-dice/dice-box-threejs'
  import { onMount } from 'svelte'
  import { showError, showSuccess } from '@lib/toasts'
  import { getSavedStore } from '@lib/stores'

  export let threadId
  export let gameId
  export let onRoll

  let diceBox
  let notation = ''

  const defaults = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 }
  const gameStore = getSavedStore('game-' + gameId)
  $gameStore.dice = $gameStore.dice || defaults

  onMount(() => {
    diceBox = new DiceBox('#diceBox', { sounds: true, assetPath: '/dice/' })
    diceBox.initialize()
  })

  async function showRoll () {
    // convert into dice notation (eg. '2d4,3d6,1d20,2d10')
    const diceNotation = Object.entries($gameStore.dice).filter(([key, value]) => value > 0).map(([key, value]) => `${value}${key}`).join(',')
    if (diceNotation) {
      // rolls are happening on the server
      const res = await fetch(`/api/game/roll?thread=${threadId}&dice=${encodeURIComponent(diceNotation)}&owner=${$gameStore.activeGameCharacterId}`, { method: 'GET' })
      const json = await res.json()
      if (res.error || json.error) { return showError(res.error || json.error) }
      console.log('json.results', json.results)
      await diceBox.roll(json.results)
      onRoll()
    } else {
      showError('Nemáš vybrané žádné kostky')
    }
  }

  function parseNotation (event) {
    const dicePattern = /(\d+)(d\d+)/g
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

  // parse dice values into dice notation (eg. '2d4,3d6,1d20,2d10')
  $: { if ($gameStore) { notation = Object.entries($gameStore.dice).filter(([key, value]) => value > 0).map(([key, value]) => `${value}${key}`).join(',') } }
</script>

<div class='wrapper'>
  <div id='diceBox'></div>
  <div class='tools'>
    <div class='die'>
      <button on:click={() => { clearDice('d4') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('d4') }} class='addLarge d4'>d4</button>
      <input type='text' bind:value={$gameStore.dice.d4} maxlength='2' class='count' />
      <button on:click={() => { subDice('d4') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('d4') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('d6') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('d6') }} class='addLarge d6'>d6</button>
      <input type='text' bind:value={$gameStore.dice.d6} maxlength='2' class='count' />
      <button on:click={() => { subDice('d6') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('d6') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('d8') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('d8') }} class='addLarge d8'>d8</button>
      <input type='text' bind:value={$gameStore.dice.d8} maxlength='2' class='count' />
      <button on:click={() => { subDice('d8') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('d8') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('d10') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('d10') }} class='addLarge d10'>d10</button>
      <input type='text' bind:value={$gameStore.dice.d10} maxlength='2' class='count' />
      <button on:click={() => { subDice('d10') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('d10') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('d12') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('d12') }} class='addLarge d12'>d12</button>
      <input type='text' bind:value={$gameStore.dice.d12} maxlength='2' class='count' />
      <button on:click={() => { subDice('d12') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('d12') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('d20') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('d20') }} class='addLarge d20'>d20</button>
      <input type='text' bind:value={$gameStore.dice.d20} maxlength='2' class='count' />
      <button on:click={() => { subDice('d20') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('d20') }} class='add material'>add</button>
    </div>
    <div class='die'>
      <button on:click={() => { clearDice('d100') }} class='clear material'>delete</button>
      <button on:click={() => { addDice('d100') }} class='addLarge d10'>d100</button>
      <input type='text' bind:value={$gameStore.dice.d100} maxlength='2' class='count' />
      <button on:click={() => { subDice('d100') }} class='sub material'>remove</button>
      <button on:click={() => { addDice('d100') }} class='add material'>add</button>
    </div>
  </div>
  <div class='row'>
    <div class='notation'>
      <input type='text' value={notation} on:input={parseNotation} size='30' />
      <button on:click={copyNotation} class='copy material plain'>content_copy</button>
    </div>
    <button on:click={showRoll} class='roll' disabled>Hodit bez uložení</button>
    <button on:click={showRoll} class='roll' disabled>Hodit soukromě</button>
    <button on:click={showRoll} class='roll'>Hodit veřejně</button>
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
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          margin-top: 10px;
          box-shadow: none;
          text-shadow: 1px 1px 6px #0005;
          width: 80px;
          height: 80px;
          background-size: contain;
          background-repeat: no-repeat;
          position: relative;
          font-size: 2rem;
        }
          .addLarge:hover, .add:hover, .sub:hover, .clear:hover {
            transform: scale(1.1);
          }
        .clear, .sub, .add {
          position: absolute;
          padding: 5px;
          font-size: 1.2rem;
          color: var(--dim);
        }
        .sub {
          border-radius: 0px 10px 0px 10px;
          bottom: 0px;
          left: 0px;
        }
        .add {
          border-radius: 10px 0px 10px 0px;
          bottom: 0px;
          right: 0px;
        }
        .clear {
          border-radius: 10px 0px 10px 0px;
          top: 0px;
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
          padding: 5px;
        }
        button.d4 {
          background-image: url('/dice/d4.png');
        }
        button.d6 {
          background-image: url('/dice/d6.png');
        }
        button.d8 {
          background-image: url('/dice/d8.png');
        }
        button.d10 {
          background-image: url('/dice/d10.png');
        }
        button.d12 {
          background-image: url('/dice/d12.png');
        }
        button.d12 {
          background-image: url('/dice/d12.png');
        }
        button.d20 {
          background-image: url('/dice/d20.png');
        }
    #diceBox {
      width: 100%;
      height: 400px;
      background: url('/feld.jpg');
    }
    .row {
      padding: 20px;
      display: flex;
      justify-content: space-around;
    }
    .notation {
      position: relative;
    }
      .notation input {
        width: 100%;
      }
      .copy {
        position: absolute;
        top: 5px;
        right: -5px;
      }

  @media (max-width: 860px) {
    .tools {
      flex-wrap: wrap;
    }
  }
</style>
