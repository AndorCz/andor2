<script>
  import { supabase, handleError } from '@lib/database-browser'

  async function loadData () {
    const { data: games, error: gameError } = await supabase.from('game_list').select('*').order('created_at', { ascending: false }).limit(3)
    if (gameError) { handleError(gameError) }

    const { data: works, error: workError } = await supabase.from('work_list').select('*').order('created_at', { ascending: false }).not('editorial', 'eq', true).limit(3)
    if (workError) { handleError(workError) }

    const { data: boards, error: boardError } = await supabase.from('board_list').select('*').order('created_at', { ascending: false }).limit(3)
    if (boardError) { handleError(boardError) }

    return { games, works, boards }
  }
</script>

{#await loadData() then last}
  <div id='latest'>
    <div class='group'>
      <h4>Hry</h4>
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
    <div class='group'>
      <h4>Tvorba</h4>
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
      <h4>Diskuze</h4>
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
