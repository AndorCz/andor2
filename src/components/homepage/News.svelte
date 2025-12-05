<script>
  import { supabase, handleError, getHeaderUrl } from '@lib/database-browser'

  async function loadData () {
    const { data: games, error: gameError } = await supabase.from('game_list').select('*').order('created_at', { ascending: false }).limit(3)
    if (gameError) { handleError(gameError) }

    const { data: works, error: workError } = await supabase.from('work_list').select('*').order('published_at', { ascending: false, nullsLast: true }).not('editorial', 'eq', true).limit(3)
    if (workError) { handleError(workError) }

    const { data: boards, error: boardError } = await supabase.from('board_list').select('*').order('created_at', { ascending: false }).limit(3)
    if (boardError) { handleError(boardError) }

    return { games, works, boards }
  }

  function limitLength (text, length) {
    return text.length > length ? text.slice(0, length) + '...' : text
  }
</script>

{#await loadData() then last}
  <div id='news'>
    {#each last.games as game}
      <div class='item'>
        {#if game.custom_header}
          <img src={getHeaderUrl('game', game.id)} alt={game.name} />
        {/if}
        <main>
          <h4>Nová hra</h4>
          <a href={`/game/${game.id}`}>
            <h2>{game.name}</h2>
            {#if game.annotation}
              <p>{limitLength(game.annotation, 150)}</p>
            {/if}
          </a>
          <div class='details'>
            <span class='date'>{new Date(game.created_at).toLocaleDateString('cs')}</span>
            <a href={'/user?id=' + game.owner} class='user'>{game.owner_name}</a>
          </div>
        </main>
      </div>
    {/each}
    {#each last.works as work}
      <div class='item'>
        {#if work.custom_header}
          <img src={getHeaderUrl('work', work.id)} alt={work.name} />
        {/if}
        <main>
          <h4>Nové dílo</h4>
          <a href={`/work/${work.id}`}>
            <h2>{work.name}</h2>
            {#if work.annotation}
              <p>{limitLength(work.annotation, 150)}</p>
            {/if}
          </a>
          <div class='details'>
            <span class='date'>{new Date(work.published_at || work.created_at).toLocaleDateString('cs')}</span>
            <a href={'/user?id=' + work.owner} class='user'>{work.owner_name}</a>
          </div>
        </main>
      </div>
    {/each}
    {#each last.boards as board}
      <div class='item'>
        {#if board.custom_header}
          <img src={getHeaderUrl('board', board.id)} alt={board.name} />
        {/if}
        <main>
          <h4>Nová diskuze</h4>
          <a href={`/board/${board.id}`}>
            <h2>{board.name}</h2>
            {#if board.annotation}
              <p>{limitLength(board.annotation, 150)}</p>
            {/if}
          </a>
          <div class='details'>
            <span class='date'>{new Date(board.created_at).toLocaleDateString('cs')}</span>
            <a href={'/user?id=' + board.owner} class='user'>{board.owner_name}</a>
          </div>
        </main>
      </div>
    {/each}
  </div>
{/await}

<style>
  #news {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
    .item img {
      max-width: 100%;
      display: block;
      min-height: 100px;
      object-fit: cover;
    }
    main {
      padding: 20px;
    }
      .item a {
        display: block;
      }
      .item h4 {
        margin-top: 0px;
        margin-bottom: 0px;
        font-size: 18px;
      }
      .item h2 {
        margin-top: 0px;
        margin-bottom: 10px;
        font-size: 26px;
        line-height: 120%;
      }
      .item p {
        font-size: 16px;
        color: var(--dim);
        font-style: italic;
        font-variation-settings: 'wght' 400;
        margin-top: 5px;
      }
        .details {
          display: flex;
          justify-content: space-between;
        }
        .date {
          font-size: 16px;
          color: var(--dim);
        }
</style>
