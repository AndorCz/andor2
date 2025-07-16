<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { isFilledArray } from '@lib/utils'
  import { getSavedStore } from '@lib/stores'
  import { workTagsText, workTagsImage, workTagsMusic, workCategoriesText, workCategoriesImage, workCategoriesMusic } from '@lib/constants'

  const { user = {}, works = [], activeTab = 'articles', showHeadline = false, page = 0, maxPage = 0 } = $props()

  let listView = $state(false)
  let workListStore

  // functions to run only in the browser
  let getHeaderUrl = $state(() => {})
  let getPortraitUrl = $state(() => {})
  let getWorkFileUrl = $state(() => {})

  onMount(async () => {
    const databaseBrowser = await import('@lib/database-browser')
    getHeaderUrl = databaseBrowser.getHeaderUrl
    getPortraitUrl = databaseBrowser.getPortraitUrl
    getWorkFileUrl = databaseBrowser.getWorkFileUrl

    workListStore = getSavedStore('works', { listView: false })
    listView = $workListStore.listView
  })

  function getTags (work) {
    const source = work.type === 'text' ? workTagsText : work.type === 'image' ? workTagsImage : workTagsMusic
    return work.tags.map(tag => source.find(t => t.value === tag)?.label || tag).join(', ')
  }

  function getCategory (work) {
    if (work.editorial) { return 'Editorial' }
    const source = work.type === 'text' ? workCategoriesText : work.type === 'image' ? workCategoriesImage : workCategoriesMusic
    const category = source.find(c => c.value === work.category)
    return category && category.value !== 'other' ? category.label : ''
  }

  function setListView (val) {
    listView = $workListStore.listView = val
  }

  function triggerPaging (newPage) {
    const url = new URL(window.location)
    url.searchParams.set('page', newPage)
    window.location.href = url.toString()
  }

  function navigateTab (tab) {
    const url = new URL(window.location)
    url.searchParams.set('tab', tab)
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }
</script>

{#if showHeadline}
  <div class='headline flex'>
    <h1>Tvorba</h1>
    <div class='buttons'>
      <div class='toggle'>
        <button onclick={() => { setListView(false) }} class:active={!listView} class='material'>table_rows</button>
        <button onclick={() => { setListView(true) }} class:active={listView} class='material'>table_rows_narrow</button>
      </div>
      {#if user.id}
        <a href={'./work/work-form?type=' + (activeTab === 'articles' ? 'text' : activeTab === 'images' ? 'image' : 'audio')} class='button desktop'>Vytvořit nové dílo</a>
        <a href={'./work/work-form?type=' + (activeTab === 'articles' ? 'text' : activeTab === 'images' ? 'image' : 'audio')} class='button mobile material'>add</a>
      {/if}
    </div>
  </div>
{/if}

<nav class='tabs secondary'>
  <button onclick={() => { navigateTab('articles') }} class:active={activeTab === 'articles'}>
    Články
  </button>
  <button onclick={() => { navigateTab('images') }} class:active={activeTab === 'images'}>
    Obrázky
  </button>
  <button onclick={() => { navigateTab('music') }} class:active={activeTab === 'music'}>
    Hudba
  </button>
</nav>

{#if isFilledArray(works)}
  {#if listView}
    <table class='list'>
      <thead>
        <tr><th>název</th><th class='category'>kategorie</th><th>tagy</th><th>příspěvků</th><th class='owner'>autor</th></tr>
      </thead>
      <tbody>
        {#each works as work (work.id)}
          <tr class='work' class:editorial={work.editorial}>
            <td><div class='name'><a href='./work/{work.id}'>{work.name}</a></div></td>
            <td><div class='category'>{getCategory(work)}</div></td>
            <td><div class='tags'>{getTags(work)}</div></td>
            <td><div class='count'>{work.post_count}</div></td>
            <td>
              <a href='./user?id={work.owner_id}' class='user owner'>
                {work.owner_name}
                {#if work.owner_portrait}<img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='icon' alt={work.owner_name} />{/if}
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    {#each works as work (work.id)}
      <div class='block' class:editorial={work.editorial}>
        {#if work.custom_header || work.type === 'image'}
          <div class='col image'>
            {#if work.type === 'image'}
              <img src={getWorkFileUrl(work.content)} alt={work.name} />
            {:else}
              <img src={getHeaderUrl('work', work.id, work.custom_header)} alt='work header' />
            {/if}
          </div>
        {/if}
        <div class='col left'>
          <div class='name'><a href='./work/{work.id}'>{work.name}</a></div>
          <div class='annotation' title={work.annotation} use:tooltip>{work.annotation || ''}</div>
          <div class='meta'>
            <div class='category' title='kategorie' use:tooltip>{getCategory(work)}</div>
            <div class='tags' title='tagy' use:tooltip>{getTags(work)}</div>
            <div class='count' title='příspěvků' use:tooltip>{work.post_count}<span class='material ico'>chat</span></div>
            <a href='./user?id={work.owner_id}' class='owner user' title='autor' use:tooltip>
              <span>{work.owner_name}</span>
              {#if work.owner_portrait}<img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='icon' alt={work.owner_name} />{/if}
            </a>
          </div>
        </div>
      </div>
    {/each}
  {/if}
{:else}
  <p class='info'>Žádná díla nenalezena</p>
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
    h1 { padding-left: 10px }
    .desktop { display: none }
    .mobile { display: block }
    .headline .button, .headline button {
      padding: 10px;
    }
  }

  @media (max-width: 500px) {
    .block {
      display: block;
      margin-bottom: 10px;
    }
    .block .left {
      display: block;
      padding: 15px 10px;
    }
    .block .image { width: 100% }
    .headline .button, .headline button {
      padding: 7px;
    }
  }
</style>
