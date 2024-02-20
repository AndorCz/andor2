<script>
  import { supabase, handleError, getHeaderUrl } from '@lib/database'
  import { userStore } from '@lib/stores'

  async function loadData () {
    const { data: game, error: gameError } = await supabase.from('game_list').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (gameError) { handleError(gameError) }

    const { data: work, error: workError } = await supabase.from('work_list').select('*').order('created_at', { ascending: false }).not('editorial', 'eq', 1).limit(1).maybeSingle()
    if (workError) { handleError(workError) }

    const { data: board, error: boardError } = await supabase.from('board_list').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (boardError) { handleError(boardError) }

    return { game, work, board }
  }

  function limitLength (text, length) {
    return text.length > length ? text.slice(0, length) + '...' : text
  }
</script>

{#await loadData() then last}
  <div id='news'>
    <div class='item'>
      <h4>Nová hra</h4>
      <a href={`/game/${last.game.id}`}>
        <h2>{last.game.name}</h2>
        {#if last.game.custom_header}
          <img src={getHeaderUrl('game', last.game.id)} alt={last.game.name} />
        {/if}
        {#if last.game.annotation}
          <p>{limitLength(last.game.annotation, 150)}</p>
        {/if}
      </a>
    </div>
    <div class='item'>
      <h4>Nové dílo</h4>
      <a href={`/work/${last.work.id}`}>
        <h2>{last.work.name}</h2>
        {#if last.work.custom_header}
          <img src={getHeaderUrl('work', last.work.id)} alt={last.work.name} />
        {/if}
        {#if last.work.annotation}
          <p>{limitLength(last.work.annotation, 150)}</p>
        {/if}
      </a>
    </div>
    <div class='item'>
      <h4>Nová diskuze</h4>
      <a href={`/board/${last.board.id}`}>
        <h2>{last.board.name}</h2>
        {#if last.board.custom_header}
          <img src={getHeaderUrl('board', last.board.id)} alt={last.board.name} />
        {/if}
        {#if last.board.annotation}
          <p>{limitLength(last.board.annotation, 150)}</p>
        {/if}
      </a>
    </div>
  </div>
{/await}

<style>
  .item {
    border-bottom: 5px solid var(--prominent);
    padding-top: 20px;
    padding-bottom: 20px;
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
    }
    .item img {
      max-width: 100%;
    }
    .item p {
      font-size: 16px;
      color: var(--dim);
      font-style: italic;
      font-variation-settings: 'wght' 400;
      margin-top: 5px;
    }
    .item:first-child {
      padding-top: 0px;
    }
    .item:last-child {
      padding-bottom: 0px;
      border-bottom: none;
    }
</style>
