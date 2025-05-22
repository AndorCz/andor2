<script>
  import { addURLParam } from '@lib/utils'
  import GameRoster from '@components/games/characters/GameRoster.svelte'
  import GameGraveyard from '@components/games/characters/GameGraveyard.svelte'
  import GameRecruitment from '@components/games/characters/GameRecruitment.svelte'

  export let user = {}
  export let game = {}
  export let isStoryteller
  export let isPlayer

  // sort character categories
  let activeSection = new URLSearchParams(window.location.search).get('section') || 'active'

  function changeSection (section) {
    activeSection = section
    addURLParam('section', section)
  }
</script>

<main>
  <div class='tabs tertiary'>
    <button on:click={() => { changeSection('active') }} class='tab' class:active={activeSection === 'active'}><span class='material'>groups</span>Aktivní</button>
    <button on:click={() => { changeSection('recruit') }} class='tab' class:active={activeSection === 'recruit'}><span class='material'>person_add</span>Nábor</button>
    {#if isStoryteller }
      <button on:click={() => { changeSection('grave') }} class='tab' class:active={activeSection === 'grave'}><span class='material'>skull</span>Hřbitov</button>
    {/if}
  </div>

  {#if game.archived}
    <center><div class='note'><span class='material'>info</span>Hra je archivovaná</div></center>
  {/if}

  {#if activeSection === 'active'}
    <GameRoster {game} {user} {isStoryteller} {isPlayer} />
  {:else if activeSection === 'recruit'}
    <GameRecruitment {game} {user} {isStoryteller} />
  {:else if activeSection === 'grave'}
    <GameGraveyard {game} {user} {isStoryteller} />
  {/if}
</main>

<style>
  .tabs {
    margin-top: 20px;
    margin-bottom: 30px;
  }
    .tabs button {
      display: inline-flex;
      gap: 10px;
      align-items: center;
    }
    .tabs .active {
      color: var(--text);
    }

  center {
    display: flex;
    padding-top: 20px;
    justify-content: center;
  }
  .note {
    font-style: italic;
    padding-left: 20px;
    margin-bottom: 40px;
    color: var(--dim);
    display: flex;
  }
    .note .material {
      margin-right: 10px;
    }

  @media (max-width: 400px) {
    .tabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin-top: 0px;
    }
    .tabs button {
      gap: 5px;
    }
    .tabs .material {
      font-size: 18px;
    }
  }
</style>
