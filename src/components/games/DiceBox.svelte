<script>
  import DiceBox from '@3d-dice/dice-box-threejs'
  import { onMount } from 'svelte'
  import { showError } from '@lib/toasts'
  import { getGameStore } from '@lib/stores'
  import { clone } from '@lib/utils'

  export let threadId
  export let gameId
  export let onRoll

  let diceBox

  const defaults = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 }
  const gameStore = getGameStore(gameId)
  $gameStore.dice = $gameStore.dice || defaults

  onMount(() => {
    diceBox = new DiceBox('#diceBox', { sounds: true, assetPath: '/' })
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
      await diceBox.roll(json.results)
      onRoll()
    } else {
      showError('Nemáš vybrané žádné kostky')
    }
  }

  function addDice (type) {
    $gameStore.dice[type]++ // to force update
  }

  async function clear () {
    $gameStore.dice = clone(defaults)
    diceBox.clearDice()
  }
</script>

<div class='wrapper'>
  {#if Object.values($gameStore.dice).some(value => value > 0)}
    <button on:click={clear} class='clear'>Vynulovat</button>
  {/if}
  <button on:click={() => { addDice('d4') }}>{$gameStore.dice.d4}d4</button>
  <button on:click={() => { addDice('d6') }}>{$gameStore.dice.d6}d6</button>
  <button on:click={() => { addDice('d8') }}>{$gameStore.dice.d8}d8</button>
  <button on:click={() => { addDice('d10') }}>{$gameStore.dice.d10}d10</button>
  <button on:click={() => { addDice('d12') }}>{$gameStore.dice.d12}d12</button>
  <button on:click={() => { addDice('d20') }}>{$gameStore.dice.d20}d20</button>
  <button on:click={() => { addDice('d100') }}>{$gameStore.dice.d100}d100</button>
  <div id='diceBox'></div>
  <div class='send'>
    <button on:click={showRoll} class='roll'>Hodit a zapsat</button>
  </div>
</div>

<style>
  .wrapper {
    position: relative;
  }
    #diceBox {
      width: 100%;
      height: 300px;
    }
    .clear {
      position: absolute;
      top: 0px;
      right: 0px;
    }
    .send {
      text-align: right;
    }
</style>
