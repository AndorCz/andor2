<script>
  import DiceBox from '@3d-dice/dice-box-threejs'
  import { onMount } from 'svelte'
  import { showError } from '@lib/toasts'
  import { getGameStore } from '@lib/stores'

  export let threadId
  export let gameId
  export let onRoll

  let diceBox

  const defaults = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 }
  const gameStore = getGameStore(gameId)
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
      await diceBox.roll(json.results)
      onRoll()
    } else {
      showError('Nemáš vybrané žádné kostky')
    }
  }

  function addDice (type) { $gameStore.dice[type]++ }
  function subDice (type) { $gameStore.dice[type]-- }
  function clearDice (type) { $gameStore.dice[type] = 0 }
</script>

<div class='wrapper'>
  <div id='diceBox'></div>
  <div class='tools'>
    <div class='die'>
      <div class='count'>{$gameStore.dice.d4}</div>
      <button on:click={() => { addDice('d4') }} class='add d4'>d4</button>
      <button on:click={() => { subDice('d4') }} class='sub material'>remove</button>
      <button on:click={() => { clearDice('d4') }} class='clear material'>delete</button>
    </div>
    <div class='die'>
      <div class='count'>{$gameStore.dice.d6}</div>
      <button on:click={() => { addDice('d6') }} class='add d6'>d6</button>
      <button on:click={() => { subDice('d6') }} class='sub material'>remove</button>
      <button on:click={() => { clearDice('d6') }} class='clear material'>delete</button>
    </div>
    <div class='die'>
      <div class='count'>{$gameStore.dice.d8}</div>
      <button on:click={() => { addDice('d8') }} class='add d8'>d8</button>
      <button on:click={() => { subDice('d8') }} class='sub material'>remove</button>
      <button on:click={() => { clearDice('d8') }} class='clear material'>delete</button>
    </div>
    <div class='die'>
      <div class='count'>{$gameStore.dice.d10}</div>
      <button on:click={() => { addDice('d10') }} class='add d10'>d10</button>
      <button on:click={() => { subDice('d10') }} class='sub material'>remove</button>
      <button on:click={() => { clearDice('d10') }} class='clear material'>delete</button>
    </div>
    <div class='die'>
      <div class='count'>{$gameStore.dice.d12}</div>
      <button on:click={() => { addDice('d12') }} class='add d12'>d12</button>
      <button on:click={() => { subDice('d12') }} class='sub material'>remove</button>
      <button on:click={() => { clearDice('d12') }} class='clear material'>delete</button>
    </div>
    <div class='die'>
      <div class='count'>{$gameStore.dice.d20}</div>
      <button on:click={() => { addDice('d20') }} class='add d20'>d20</button>
      <button on:click={() => { subDice('d20') }} class='sub material'>remove</button>
      <button on:click={() => { clearDice('d20') }} class='clear material'>delete</button>
    </div>
    <div class='die'>
      <div class='count'>{$gameStore.dice.d100}</div>
      <button on:click={() => { addDice('d100') }} class='add d10'>d100</button>
      <button on:click={() => { subDice('d100') }} class='sub material'>remove</button>
      <button on:click={() => { clearDice('d100') }} class='clear material'>delete</button>
    </div>
    <button on:click={showRoll} class='roll'>Hodit</button>
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
        padding-bottom: 30px;
      }
        .add {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          box-shadow: none;
          text-shadow: 1px 1px 6px #0005;
          width: 80px;
          height: 80px;
          background-size: contain;
          background-repeat: no-repeat;
          position: relative;
          font-size: 2rem;
        }
          .add:hover, .clear:hover {
            transform: scale(1.1);
          }
        .clear, .sub {
          position: absolute;
          bottom: 0px;
          padding: 5px;
          font-size: 1.2rem;
          color: var(--dim);
        }
        .sub {
          border-radius: 0px 10px 0px 10px;
          left: 0px;
        }
        .clear {
          border-radius: 10px 0px 10px 0px;
          right: 0px;
        }
        .count {
          text-align: center;
          font-weight: bold;
          width: 100%;
          padding-top: 15px;
          padding-bottom: 10px;
          font-size: 2.5rem;
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
      height: 300px;
    }

  @media (max-width: 719px) {
    .tools {
      flex-wrap: wrap;
    }
  }
</style>
