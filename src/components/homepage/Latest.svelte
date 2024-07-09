<script>
  import { supabase, handleError } from '@lib/database-browser'
  import { getSavedStore } from '@lib/stores'

  let userStore

  async function loadData () {
    userStore = getSavedStore('user')
    $userStore.hpGameSort = $userStore.hpGameSort || 'latestGames'

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

    return { games, works, boards }
  }

  async function onGameSortChange (e) {
    $userStore.hpGameSort = e.target.value
    loadData()
  }
</script>

{#await loadData() then last}
  <div id='latest'>
    {#key $userStore.hpGameSort}
      <div class='group'>
        <div class='row'>
          <select bind:value={$userStore.hpGameSort} on:change={onGameSortChange}>
            <option value='latestGames'>Nové hry</option>
            <option value='activeGames'>Aktivní hry</option>
          </select>
        </div>
        {#each last.games as game}
          <div class='item'>
            <main>
              <a href={`/game/${game.id}`}>
                <h3>{game.name}</h3>
              </a>
            </main>
          </div>
        {/each}
      </div>
    {/key}
    <div class='group'>
      <a href='/works' class='headline'><h4>Nová tvorba</h4></a>
      {#each last.works as work}
        <div class='item'>
          <main>
            <a href={`/work/${work.id}`}>
              <h3>{work.name}</h3>
            </a>
          </main>
        </div>
      {/each}
    </div>
    <div class='group'>
      <a href='/boards' class='headline'><h4>Nové diskuze</h4></a>
      {#each last.boards as board}
        <div class='item'>
          <main>
            <a href={`/board/${board.id}`}>
              <h3>{board.name}</h3>
            </a>
          </main>
        </div>
      {/each}
    </div>
  </div>
{/await}

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
    }
    main {
      padding: 0px;
    }
      .item a {
        display: block;
      }
      .item h3 {
        font: var(--bodyFont);
        margin-top: 0px;
        margin-bottom: 0px;
      }
</style>
