<script>
  import { onMount } from 'svelte'
  import { workTags, workCategoriesText } from '@lib/constants'
  import { getSavedStore } from '@lib/stores'
  import { isFilledArray } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'

  export let user = {}
  export let works = []
  export let activeTab = 'articles'
  export let showHeadline = false

  let listView = false
  let workListStore

  // functions to run only in the browser
  let getHeaderUrl = () => {}
  let getPortraitUrl = () => {}

  onMount(async () => {
    const databaseBrowser = await import('@lib/database-browser')
    getHeaderUrl = databaseBrowser.getHeaderUrl
    getPortraitUrl = databaseBrowser.getPortraitUrl

    workListStore = getSavedStore('works', { listView: false })
    listView = $workListStore.listView
  })

  function getTags (value) {
    return value.map(tag => workTags.find(t => t.value === tag).label).join(', ')
  }

  function getCategory (work) {
    if (work.editorial) { return 'Editorial' }
    const category = workCategoriesText.find(c => c.value === work.category)
    return category.value !== 'other' ? category.label : ''
  }

  function setListView (val) {
    listView = $workListStore.listView = val
  }
</script>

{#if showHeadline}
  <div class='headline flex'>
    <h1>Tvorba</h1>
    <div class='buttons'>
      <div class='toggle'>
        <button on:click={() => { setListView(false) }} class:active={!listView} class='material'>table_rows</button>
        <button on:click={() => { setListView(true) }} class:active={listView} class='material'>table_rows_narrow</button>
      </div>
      {#if user.id}
        <a href='./work/work-form' class='button desktop'>Vytvořit nové dílo</a>
        <a href='./work/work-form' class='button mobile material'>add</a>
      {/if}
    </div>
  </div>
{/if}

<nav class='tabs secondary'>
  <button on:click={() => { activeTab = 'articles' }} class:active={activeTab === 'articles'}>
    Články
  </button>
  <button disabled on:click={() => { activeTab = 'images' }} class:active={activeTab === 'images'}>
    Obrázky
  </button>
  <button disabled on:click={() => { activeTab = 'music' }} class:active={activeTab === 'music'}>
    Hudba
  </button>
</nav>

{#if isFilledArray(works)}
  {#if listView}
    <table class='list'>
      <tr><th>název</th><th class='category'>kategorie</th><th>tagy</th><th>příspěvků</th><th class='owner'>autor</th></tr>
      {#each works as work}
        <tr class='work' class:editorial={work.editorial}>
          <td><div class='name'><a href='./work/{work.id}'>{work.name}</a></div></td>
          <td><div class='category'>{getCategory(work)}</div></td>
          <td><div class='tags'>{getTags(work.tags)}</div></td>
          <td><div class='count'>{work.post_count}</div></td>
          <td>
            <a href='./user?id={work.owner_id}' class='user owner'>
              {work.owner_name}
              {#if work.owner_portrait}<img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='icon' alt={work.owner_name} />{/if}
            </a>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    {#each works as work}
      <div class='block' class:editorial={work.editorial}>
        <div class='col left'>
          <div class='name'><a href='./work/{work.id}'>{work.name}</a></div>
          <div class='annotation' title={work.annotation} use:tooltip>{work.annotation || ''}</div>
          <div class='meta'>
            <div class='category' title='kategorie'>{getCategory(work)}</div>
            <div class='tags' title='tagy'>{getTags(work.tags)}</div>
            <div class='count' title='příspěvků'>{work.post_count}<span class='material ico'>chat</span></div>
            <a href='./user?id={work.owner_id}' class='owner user' title='autor'>
              {work.owner_name}
              {#if work.owner_portrait}<img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='icon' alt={work.owner_name} />{/if}
            </a>
          </div>
        </div>
        {#if work.custom_header}
          <div class='col image'>
            <img src={getHeaderUrl('work', work.id, work.custom_header)} alt='work header' />
          </div>
        {/if}
      </div>
    {/each}
  {/if}
{:else}
  <p class='info'>Žádná díla nenalezena</p>
{/if}

<style>
  .info {
    padding: 20px;
    text-align: center;
  }
  .headline {
    justify-content: space-between;
  }
  .mobile { display: none }
  .desktop { display: block }

  .buttons {
    display: flex;
    gap: 20px;
  }

  .name a:first-letter {
    text-transform: uppercase;
  }
  .tabs {
    margin-bottom: 20px;
  }
  .editorial {
    background-color: var(--prominent) !important;
  }

  /* blocks */

  .block {
    background-color: var(--block);
    display: flex;
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
        font-size: 24px;
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
        .block .count {
          font-family: arial, sans-serif;
          font-size: 16px;
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .block .tags {
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        .block .ico {
          font-size: 16px;
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

  /* list */

  .list {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 2px;
  }
    th {
      text-align: left;
      padding: 10px 0px;
      font-variation-settings: 'wght' 300;
      color: var(--dim);
    }
      th:first-child {
        padding-left: 20px;
      }
    td {
      background-color: var(--block);
      margin-bottom: 2px;
    }
      .list .name a {
        display: inline-block;
        width: 100%;
        height: 100%;
        padding: 20px;
      }
      .category {
        padding-right: 20px;
      }

  /* common */

  .owner {
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
  .list .owner {
    padding-right: 20px;
  }

  @media (max-width: 1200px) {
    .block .name {
      flex-basis: 100%;
    }
  }

  @media (max-width: 860px) {
    h1 {
      padding-left: 10px;
    }
    .desktop { display: none }
    .mobile { display: block }
    .button { padding: 10px }
  }

  @media (max-width: 500px) {
    .block {
      display: block;
    }
    .block .image {
      width: 100%;
    }
    .icon {
      display: none;
    }
  }
</style>
