<script>
  import { onMount } from 'svelte'
  import { getHeaderUrl, getPortraitUrl } from '@lib/database'
  import { workTags, workCategoriesText } from '@lib/constants'
  import { getSavedStore } from '@lib/stores'
  import { isFilledArray } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'

  export let user = {}
  export let works = []
  export let activeTab = 'articles'
  export let showHeadline = false
  export let showTabs = false

  let listView = false
  let workListStore

  onMount(() => {
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

{#if showTabs}
  <nav class='tabs secondary'>
    <button on:click={() => { activeTab = 'articles' }} class={activeTab === 'articles' ? 'active' : ''}>
      Články
    </button>
    <button disabled on:click={() => { activeTab = 'images' }} class={activeTab === 'images' ? 'active' : ''}>
      Obrázky
    </button>
    <button disabled on:click={() => { activeTab = 'music' }} class={activeTab === 'music' ? 'active' : ''}>
      Hudba
    </button>
  </nav>
{/if}

{#if isFilledArray(works)}
  {#if listView}
    <table class='list'>
      <tr>
        <th>název</th>
        <th>kategorie</th>
        <th>tagy</th>
        <th>příspěvků</th>
        <th>autor</th>
      </tr>
      {#each works as work}
        <tr class='work' class:editorial={work.editorial}>
          <td><div class='name'><a href='./work/{work.id}'>{work.name}</a></div></td>
          <td><div class='category'>{getCategory(work)}</div></td>
          <td><div class='tags'>{getTags(work.tags)}</div></td>
          <td><div class='count'>{work.post_count}</div></td>
          <td><div class='owner user'>{work.owner_name}{#if work.owner_portrait}<img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='portrait' alt={user.name} />{/if}</div></td>
        </tr>
      {/each}
    </table>
  {:else}
    {#each works as work}
      <div class='block' class:editorial={work.editorial}>
        <div class='col left'>
          <div class='row basics'>
            <div class='name'><a href='./work/{work.id}'>{work.name}</a></div>
            <div class='category' title='kategorie'>{getCategory(work)}</div>
            <div class='tags' title='tagy'>{getTags(work.tags)}</div>
            <div class='count' title='příspěvků'>{work.post_count}<span class='material ico'>chat</span></div>
            <div class='owner user' title='autor'>{work.owner_name}{#if work.owner_portrait}<img src={getPortraitUrl(work.owner_id, work.owner_portrait)} class='portrait' alt={user.name} />{/if}</div>
          </div>
          <div class='row annotation' title={work.annotation} use:tooltip>{work.annotation}</div>
        </div>
        {#if work.custom_header}
          <div class='col image'>
            <img src={getHeaderUrl('work', work.id)} alt='work header' />
          </div>
        {/if}
      </div>
    {/each}
  {/if}
{:else}
  <center>Žádná díla nenalezena</center>
{/if}

<style>
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
  center {
    padding: 50px;
  }

  /* blocks */

  .block {
    background-color: var(--block);
    display: flex;
    margin-bottom: 5px;
  }
    .block .left {
      padding: 10px;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
    }
      .block .row {
        padding: 10px;
      }
      .block .basics {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        padding-bottom: 5px;
        justify-content: space-between;
        align-items: center;
      }
        .block .name {
          flex: 1;
        }
          .block .name a {
            font-size: 24px;
          }
        .block .count {
          font-family: arial, sans-serif;
          font-size: 16px;
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .block .ico {
          font-size: 16px;
        }
      .block .annotation {
        font-style: italic;
        padding-top: 5px;
        color: var(--dim);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

  /* common */

  .owner {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
    .portrait {
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
    .toggle {
      display: none;
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
    .portrait {
      display: none;
    }
  }
</style>
