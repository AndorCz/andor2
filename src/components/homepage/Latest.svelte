<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import { getSavedStore } from '@lib/stores'
  import { tooltip } from '@lib/tooltip'

  let userStore
  let latestData = { games: [], works: [], boards: [] }
  let loading = true

  onMount(async () => {
    userStore = getSavedStore('user')
    $userStore.hpGameSort = $userStore.hpGameSort || 'latestGames'
    await loadData()
  })

  async function loadData () {
    loading = true

    const gameQuery = supabase.from('game_list').select('*').match({ published: true })
    switch ($userStore.hpGameSort) {
      case 'latestGames': gameQuery.order('created_at', { ascending: false }); break
      case 'activeGames': gameQuery.not('last_post', 'is', null).order('last_post', { ascending: false }); break
      default: gameQuery.order('created_at', { ascending: false }); break
    }
    const { data: games, error: gameError } = await gameQuery.limit(5)
    if (gameError) { handleError(gameError) }

    const { data: works, error: workError } = await supabase.from('work_list').select('*').match({ published: true }).order('created_at', { ascending: false }).not('editorial', 'eq', true).limit(5)
    if (workError) { handleError(workError) }

    const { data: boards, error: boardError } = await supabase.from('board_list').select('*').match({ published: true }).order('created_at', { ascending: false }).limit(5)
    if (boardError) { handleError(boardError) }

    latestData = { games, works, boards }
    loading = false
  }

  async function onGameSortChange (e) {
    $userStore.hpGameSort = e.target.value
    await loadData()
  }
</script>

{#if loading}
  <div>Načítám...</div>
{:else}
  <div id='latest'>
    <div class='group'>
      <div class='row'>
        <select value={$userStore.hpGameSort} on:change={onGameSortChange}>
          <option value='latestGames'>Nové hry</option>
          <option value='activeGames'>Aktivní hry</option>
        </select>
      </div>
      {#each latestData.games as game}
        <div class='item'>
          {#if game.owner_portrait}
            <a href='./user?id={game.owner_id}' class='user owner' title={game.owner_name} use:tooltip>
              <img src={getPortraitUrl(game.owner_id, game.owner_portrait)} class='icon' alt={game.owner_name} />
            </a>
          {/if}
          <a href={`/game/${game.id}`}>
            <h3>{game.name}</h3>
          </a>
        </div>
      {/each}
    </div>
    <div class='group'>
      <a href='/works' class='headline'><h4>Nová tvorba</h4></a>
      {#each latestData.works as work}
        <div class='item'>
          {#if work.owner_portrait}
            <a href='./user?id={work.owner_id}' class='user owner' title={work.owner_name} use:tooltip>
              <img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='icon' alt={work.owner_name} />
            </a>
          {/if}
          <a href={`/work/${work.id}`}>
            <h3>{work.name}</h3>
          </a>
        </div>
      {/each}
    </div>
    <div class='group'>
      <a href='/boards' class='headline'><h4>Nové diskuze</h4></a>
      {#each latestData.boards as board}
        <div class='item'>
          {#if board.owner_portrait}
            <a href='./user?id={board.owner_id}' class='user owner' title={board.owner_name} use:tooltip>
              <img src={getPortraitUrl(board.owner_id, board.owner_portrait)} class='icon' alt={board.owner_name} />
            </a>
          {/if}
          <a href={`/board/${board.id}`}>
            <h3>{board.name}</h3>
          </a>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  #latest {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
    .headline {
      color: var(--text);
    }
      .headline:hover {
        color: var(--maximum);
      }
    select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      font-family: var(--headlineFont);
      font-variation-settings: 'wght' 600;
      width: 100%;
      padding: 0px;
      font-size: 19px;
      margin-bottom: 10px;
      border: none;
      box-shadow: none;
      background-color: transparent;
      background-position: right 10px center;
      background-size: 24px 24px;
      background-repeat: no-repeat;
      background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 960 960" width="24px" fill="%23c4b6ab"%3E%3Cpath d="M480 600L280 400h400L480 600Z"/%3E%3C/svg%3E');
     }
      select:hover {
        color: var(--maximum);
      }
    h4 {
      margin: 0px;
      margin-bottom: 10px;
    }
    .item {
      margin-bottom: 10px;
      padding: 0px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
      .item a {
        display: block;
      }
      .item h3 {
        font: var(--bodyFont);
        margin-top: 0px;
        margin-bottom: 0px;
      }

  .owner {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
    .icon {
      display: block;
      width: 30px;
      height: 30px;
      object-fit: cover;
      object-position: center 20%;
      border-radius: 100%;
      background-color: var(--background);
    }
</style>
