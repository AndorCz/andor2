<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import { getSavedStore } from '@lib/stores'
  import { tooltip } from '@lib/tooltip'

  let loading = $state(true)
  let userStore = $state()
  let latestData = $state({ games: [], works: [], boards: [], characters: [] })

  onMount(async () => {
    userStore = getSavedStore('user')
    $userStore.hpGameSort = $userStore.hpGameSort || 'latestGames'
    await loadData()
  })

  async function loadData () {
    loading = true

    const { data, error } = await supabase
      .from('homepage_latest')
      .select('*')
      .order('section')
      .order('rank')

    if (error) { handleError(error) }

    if (data) {
      latestData = {
        games: rowsToItems(data, $userStore.hpGameSort),
        works: rowsToItems(data, 'works'),
        boards: rowsToItems(data, 'boards'),
        characters: rowsToItems(data, 'characters'),
        concepts: rowsToItems(data, 'concepts')
      }
    }
    loading = false
  }

  function rowsToItems (rows, section) {
    return rows
      .filter(row => row.section === section)
      .map(row => ({
        id: row.item_id,
        name: row.name,
        owner_id: row.owner_id,
        owner_name: row.owner_name,
        owner_portrait: row.owner_portrait,
        portrait: row.item_portrait,
        created_at: row.created_at,
        last_post: row.last_post
      }))
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
        <select value={$userStore.hpGameSort} onchange={onGameSortChange}>
          <option value='latestGames'>Nové hry</option>
          <option value='activeGames'>Aktivní hry</option>
        </select>
      </div>
      {#each latestData.games as game (game.id)}
        <div class='item'>
          <a href='./user?id={game.owner_id}' class='user owner' title={game.owner_name} use:tooltip>
            {#if game.owner_portrait}
              <img src={getPortraitUrl(game.owner_id, game.owner_portrait)} class='icon' alt={game.owner_name} />
            {:else}
              <img src='/default_user.jpg' class='icon' alt={game.owner_name} />
            {/if}
          </a>
          <a href={`/game/${game.id}`}>
            <h3>{game.name}</h3>
          </a>
        </div>
      {/each}
    </div>
    <div id='concepts'>
      <div class='group'>
        <a href='/ai' class='headline'><h4>Nové sólo koncepty</h4></a>
        {#each latestData.concepts as concept (concept.id)}
          <div class='item'>
            <a href='./user?id={concept.owner_id}' class='user owner' title={concept.owner_name} use:tooltip>
              {#if concept.owner_portrait}
                <img src={getPortraitUrl(concept.owner_id, concept.owner_portrait)} class='icon' alt={concept.owner_name} />
              {:else}
                <img src='/default_user.jpg' class='icon' alt={concept.owner_name} />
              {/if}
            </a>
            <a href={`/solo/concept/${concept.id}`}>
              <h3>{concept.name}</h3>
            </a>
          </div>
        {/each}
      </div>
    </div>
    <div class='group'>
      <a href='/works' class='headline'><h4>Nová tvorba</h4></a>
      {#each latestData.works as work (work.id)}
        <div class='item'>
          <a href='./user?id={work.owner_id}' class='user owner' title={work.owner_name} use:tooltip>
            {#if work.owner_portrait}
              <img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='icon' alt={work.owner_name} />
            {:else}
              <img src='/default_user.jpg' class='icon' alt={work.owner_name} />
            {/if}
          </a>
          <a href={`/work/${work.id}`}>
            <h3>{work.name}</h3>
          </a>
        </div>
      {/each}
    </div>
    <div class='group'>
      <a href='/boards' class='headline'><h4>Nové diskuze</h4></a>
      {#each latestData.boards as board (board.id)}
        <div class='item'>
          <a href='./user?id={board.owner_id}' class='user owner' title={board.owner_name} use:tooltip>
            {#if board.owner_portrait}
              <img src={getPortraitUrl(board.owner_id, board.owner_portrait)} class='icon' alt={board.owner_name} />
            {:else}
              <img src='/default_user.jpg' class='icon' alt={board.owner_name} />
            {/if}
          </a>
          <a href={`/board/${board.id}`}>
            <h3>{board.name}</h3>
          </a>
        </div>
      {/each}
    </div>
    {#if latestData.characters.length > 0}
      <div class='group'>
        <h4>Volné postavy</h4>
        {#each latestData.characters as character (character.id)}
          <a href={`/game/character?id=${character.id}`} class='item'>
            {#if character.portrait}
              <img src={getPortraitUrl(character.id, character.portrait)} class='icon' alt={character.name} />
            {:else}
              <img src='/default_char.jpg' class='icon' alt={character.name} />
            {/if}
            <h3>{character.name}</h3>
          </a>
        {/each}
      </div>
    {/if}
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
      background-color: var(--panel);
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
    min-width: 30px;
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
