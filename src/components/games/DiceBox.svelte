<script>
  import { onMount } from 'svelte'
  import { showError, showSuccess } from '@lib/toasts'
  import DiceBox from '@3d-dice/dice-box-threejs'
  import CharacterSelect from '@components/games/characters/CharacterSelect.svelte'

  let { game, threadId, gameStore, activeAudienceIds = $bindable(), onRoll, onAudienceSelect, myCharacters, otherCharacters } = $props()

  let diceBox
  let notation = $state('')

  const defaults = { k4: 0, k6: 0, k8: 0, k10: 0, k12: 0, k20: 0, k100: 0 }
  $gameStore.dice = $gameStore.dice || defaults

  onMount(() => {
    if (!game.archived) {
      // sanitize dice values
      Object.keys($gameStore.dice).forEach(type => {
        $gameStore.dice[type] = Number($gameStore.dice[type].toString().replace(/[^0-9]/g, ''))
      })
      try {
        diceBox = new DiceBox('#diceBox', { sounds: true, assetPath: '/dice/' })
        diceBox.initialize()
      } catch (e) {
        console.error('Failed to initialize dice box:', e)
        showError('Nepodařilo se načíst kostky')
      }
    }
  })

  async function showRoll () {
    try {
      // convert into czech dice notation (eg. '2k4,3k6,1k20,2k10')
      const diceNotation = Object.entries($gameStore.dice).filter(([key, value]) => value > 0).map(([key, value]) => `${value}${key}`).join(',')
      if (diceNotation) {
        // rolls are happening on the server
        const audience = activeAudienceIds.includes('*') ? null : activeAudienceIds // clean '*' from audience
        const res = await fetch(`/api/game/roll?thread=${threadId}&dice=${encodeURIComponent(diceNotation)}&owner=${$gameStore.activeCharacterId}&audience=${encodeURIComponent(JSON.stringify(audience))}`, { method: 'GET' })
        const json = await res.json()
        if (res.error || json.error) { return showError(res.error || json.error) }
        json.results = json.results.replaceAll('k', 'd') // convert to english dice notation for dice-box
        await diceBox.roll(json.results)
        onRoll()
      } else {
        showError('Nemáš vybrané žádné kostky')
      }
    } catch (e) {
      console.error('Error during dice roll:', e)
      showError('Nepodařilo se hodit kostky')
    }
  }

  async function showNumberRoll () {
    try {
      const input = window.prompt('Zadej horní hranici hodu (minimálně 1)', '100')
      if (input === null) { return }

      const max = parseInt(input.toString().replace(/[^0-9]/g, ''), 10)
      if (!max || max < 1) { return showError('Neplatná hodnota rozsahu') }

      const audience = activeAudienceIds.includes('*') ? null : activeAudienceIds
      const res = await fetch(`/api/game/roll?thread=${threadId}&range=${max}&owner=${$gameStore.activeCharacterId}&audience=${encodeURIComponent(JSON.stringify(audience))}`, { method: 'GET' })
      const json = await res.json()
      if (!res.ok || json.error) { return showError(json.error || 'Nepodařilo se hodit číslo') }
      showSuccess(`Padlo číslo ${json.number}`)
      onRoll()
    } catch (e) {
      console.error('Error during number roll:', e)
      showError('Nepodařilo se hodit číslo')
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

  $effect.pre(() => {
    // parse values into dice notation
    if ($gameStore) {
      notation = Object.entries($gameStore.dice).filter(([key, value]) => value > 0).map(([key, value]) => `${value}${key}`).join(',')
    }
  })
</script>

{#if game.archived}
  <p class='info'>Hra je archivovaná, není možné v ní házet.</p>
{:else}
  <div class='wrapper'>
    <div class='playground'>
      <div id='diceBox'></div>
    </div>
    <div class='tools'>
      <div class='die'>
        <button onclick={() => { clearDice('k4') }} class='clear material'>delete</button>
        <button onclick={() => { addDice('k4') }} class='addLarge k4'>k4</button>
        <input type='text' bind:value={$gameStore.dice.k4} maxlength='2' class='count' />
        <button onclick={() => { subDice('k4') }} class='sub material'>remove</button>
        <button onclick={() => { addDice('k4') }} class='add material'>add</button>
      </div>
      <div class='die'>
        <button onclick={() => { clearDice('k6') }} class='clear material'>delete</button>
        <button onclick={() => { addDice('k6') }} class='addLarge k6'>k6</button>
        <input type='text' bind:value={$gameStore.dice.k6} maxlength='2' class='count' />
        <button onclick={() => { subDice('k6') }} class='sub material'>remove</button>
        <button onclick={() => { addDice('k6') }} class='add material'>add</button>
      </div>
      <div class='die'>
        <button onclick={() => { clearDice('k8') }} class='clear material'>delete</button>
        <button onclick={() => { addDice('k8') }} class='addLarge k8'>k8</button>
        <input type='text' bind:value={$gameStore.dice.k8} maxlength='2' class='count' />
        <button onclick={() => { subDice('k8') }} class='sub material'>remove</button>
        <button onclick={() => { addDice('k8') }} class='add material'>add</button>
      </div>
      <div class='die'>
        <button onclick={() => { clearDice('k10') }} class='clear material'>delete</button>
        <button onclick={() => { addDice('k10') }} class='addLarge k10'>k10</button>
        <input type='text' bind:value={$gameStore.dice.k10} maxlength='2' class='count' />
        <button onclick={() => { subDice('k10') }} class='sub material'>remove</button>
        <button onclick={() => { addDice('k10') }} class='add material'>add</button>
      </div>
      <div class='die'>
        <button onclick={() => { clearDice('k12') }} class='clear material'>delete</button>
        <button onclick={() => { addDice('k12') }} class='addLarge k12'>k12</button>
        <input type='text' bind:value={$gameStore.dice.k12} maxlength='2' class='count' />
        <button onclick={() => { subDice('k12') }} class='sub material'>remove</button>
        <button onclick={() => { addDice('k12') }} class='add material'>add</button>
      </div>
      <div class='die'>
        <button onclick={() => { clearDice('k20') }} class='clear material'>delete</button>
        <button onclick={() => { addDice('k20') }} class='addLarge k20'>k20</button>
        <input type='text' bind:value={$gameStore.dice.k20} maxlength='2' class='count' />
        <button onclick={() => { subDice('k20') }} class='sub material'>remove</button>
        <button onclick={() => { addDice('k20') }} class='add material'>add</button>
      </div>
      <div class='die'>
        <button onclick={() => { clearDice('k100') }} class='clear material'>delete</button>
        <button onclick={() => { addDice('k100') }} class='addLarge k10'>k100</button>
        <input type='text' bind:value={$gameStore.dice.k100} maxlength='2' class='count' />
        <button onclick={() => { subDice('k100') }} class='sub material'>remove</button>
        <button onclick={() => { addDice('k100') }} class='add material'>add</button>
      </div>
    </div>

    <CharacterSelect as='Hodit za' to='Hod se zobrazí' {onAudienceSelect} {myCharacters} {otherCharacters} bind:activeAudienceIds {gameStore} />

    <div class='row'>
      <div class='notation'>
        <input type='text' value={notation} oninput={parseNotation} size='48' />
        <button onclick={copyNotation} class='copy material plain'>content_copy</button>
      </div>
      <div class='rollButtons'>
        <button onclick={showNumberRoll} class='roll small'>Hodit číslo</button>
        <button onclick={showRoll} class='roll'>Hodit kostky</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .playground {
    position: relative;
    height: 400px;
  }
    #diceBox {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background: url('/dice/feld.jpg');
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
          z-index: 999;
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
    .row {
      padding: 20px 0px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
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
    .rollButtons {
      display: flex;
      gap: 10px;
    }
      .roll {
        background: var(--primary);
        color: white;
      }
      .roll.small {
        padding: 0 16px;
        font-size: 0.9rem;
      }

  .info {
    margin: 60px 0px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  @media (max-width: 860px) {
    .tools {
      flex-wrap: wrap;
    }
    .die {
      display: flex;
      flex-direction: column-reverse;
      gap: 5px;
      background: none;
    }
    .addLarge {
      height: 60px;
      width: 60px;
    }
    .count {
      width: 100%;
    }
    .sub, .clear {
      position: relative;
      border-radius: 10px;
    }
    .add {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .tools {
      gap: 5px;
    }
    .addLarge {
      font-size: 1.5rem;
      height: 50px;
      width: 50px;
      top: -50px;
    }
  }
</style>
