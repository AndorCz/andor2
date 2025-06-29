<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { gameTags } from '@lib/constants'
  import { isFilledArray, addURLParam } from '@lib/utils'

  const { user = {}, concepts = [], page = 0, maxPage = 20 } = $props()

  let sort = $state('games')

  // functions to run only in the browser
  let getHeaderUrl = $state(() => {})
  let getPortraitUrl = $state(() => {})

  onMount(async () => {
    const databaseBrowser = await import('@lib/database-browser')
    getHeaderUrl = databaseBrowser.getHeaderUrl
    getPortraitUrl = databaseBrowser.getPortraitUrl

    const sortParam = new URL(window.location).searchParams.get('sort')
    if (sortParam) { sort = sortParam }
  })

  function getTags (game) {
    return game.tags.map(tag => gameTags.find(t => t.value === tag)?.label || tag).join(', ')
  }

  function setSort (e) {
    const newUrl = addURLParam('sort', e.target.value, true)
    window.location.href = newUrl
  }

  function triggerPaging (newPage) {
    const newUrl = addURLParam('page', newPage, true)
    window.location.href = newUrl
  }
</script>

<div class='headline flex'>
  <h1>Sólo rychlovky</h1>
    <div class='buttons'>
      <select bind:value={sort} onchange={setSort}>
        <option value='games'>Dle popularity</option>
        <option value='new'>Dle data</option>
        <option value='name'>Dle názvu</option>
        <option value='author'>Dle autora</option>
      </select>
      {#if user.id}
        <a href='./solo/concept/concept-form' class='button desktop'>Vytvořit nový koncept</a>
        <a href='./solo/concept/concept-form' class='button mobile material'>add</a>
      {/if}
    </div>
</div>

{#if isFilledArray(concepts)}
  {#each concepts as concept (concept.id)}
    <div class='block'>
      {#if concept.custom_header}
        <div class='col image'>
          <img src={getHeaderUrl('solo', concept.id, concept.custom_header)} alt='solo header' />
        </div>
      {/if}
      <div class='col left'>
        <div class='name'><a href='./solo/concept/{concept.id}'>{concept.name}</a></div>
        <div class='annotation'>{concept.annotation || ''}</div>
        <div class='meta'>
          <div class='games' title='počet her' use:tooltip>{concept.game_count}</div>
          <div class='tags' title='tagy' use:tooltip>{getTags(concept)}</div>
          <a href='./user?id={concept.author.id}' class='user author' title='autor' use:tooltip>
            {concept.author.name}
            {#if concept.author.portrait}<img src={getPortraitUrl(concept.author.id, concept.author.portrait)} class='icon' alt={concept.author.name} />{/if}
          </a>
        </div>
      </div>
    </div>
  {/each}
{:else}
  <p class='info'>Žádné herní koncepty nenalezeny</p>
{/if}

{#if maxPage > 0}
  <div class='pagination'>
    {#each { length: maxPage + 1 } as _, i (i)}
      <button onclick={() => { triggerPaging(i) }} disabled={i === page}>{i + 1}</button>
    {/each}
  </div>
{/if}

<style>
  .info {
    padding: 20px;
    text-align: center;
  }
  .headline {
    justify-content: space-between;
  }

  .buttons {
    display: flex;
    gap: 20px;
  }
    .buttons select {
      width: fit-content;
      padding: 10px;
      padding-right: 35px;
      font-size: 16px;
    }

  .mobile { display: none }
  .desktop { display: block }

  .name a:first-letter {
    text-transform: uppercase;
  }

  .author {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
    .icon {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: cover;
      object-position: center 20%;
      border-radius: 100%;
      background-color: var(--background);
    }

  /* blocks */

  .block {
    background-color: var(--block);
    display: flex;
    flex-direction: row-reverse;
    margin-bottom: 5px;
    min-height: 115px;
  }
    .block .left {
      padding: 20px;
      padding-bottom: 10px;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
    }
      .block .name a {
        font-size: 22px;
      }
      .block .annotation {
        font-style: italic;
        padding: 5px 0px;
        color: var(--dim);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .block .meta {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 20px;
      }
    .block .image {
      width: 30%;
      overflow: hidden;
    }
      .block .image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

  /*
  .pagination {
    text-align: center;
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 18px;
      padding: 0px;
      width: 40px;
      height: 40px;
    }
  */

  @media (max-width: 1200px) {
    .block .name {
      flex-basis: 100%;
    }
  }

  @media (max-width: 860px) {
    h1 { padding-left: 10px }
    .desktop { display: none }
    .mobile { display: block }
    .headline .button {
      padding: 10px;
    }
  }

  @media (max-width: 500px) {
    .block {
      display: block;
      margin-bottom: 10px;
    }
    .block .left { padding: 15px 10px }
    .block .image { width: 100% }
    .headline .button {
      padding: 7px;
    }
  }
</style>
