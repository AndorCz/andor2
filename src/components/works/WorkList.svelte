<script>
  import { userStore } from '@lib/stores'
  import { workTags, workCategoriesText } from '@lib/constants'

  export let user = {}
  export let works = []

  $userStore.activeWorksTab = $userStore.activeWorksTab || 'articles'

  function getTags (value) {
    return value.map(tag => workTags.find(t => t.value === tag).label).join(', ')
  }

  function getCategory (value) {
    return workCategoriesText.find(c => c.value === value).label
  }
</script>

<div class='headline flex'>
  <h1>Tvorba</h1>
  {#if user.id}
    <div>
      <a href='./work/work-form' class='button desktop'>Vytvořit nové dílo</a>
      <a href='./work/work-form' class='button mobile material'>add</a>
    </div>
  {/if}
</div>
<nav class='tabs secondary'>
  <button on:click={() => { $userStore.activeWorksTab = 'articles' }} class={$userStore.activeWorksTab === 'articles' ? 'active' : ''}>
    Články
  </button>
  <button disabled on:click={() => { $userStore.activeWorksTab = 'images' }} class={$userStore.activeWorksTab === 'images' ? 'active' : ''}>
    Obrázky
  </button>
  <button disabled on:click={() => { $userStore.activeWorksTab = 'music' }} class={$userStore.activeWorksTab === 'music' ? 'active' : ''}>
    Hudba
  </button>
</nav>
{#if works?.length > 0}
  <table id='works'>
    <tr>
      <th>název</th>
      <th>kategorie</th>
      <th>tagy</th>
      <th>příspěvků</th>
      <th>autor</th>
    </tr>
    {#each works as work}
      <tr class='work'>
        <td><div class='name'><a href='./work/{work.id}'>{work.name}</a></div></td>
        <td><div class='category'>{getCategory(work.category)}</div></td>
        <td><div class='tags'>{getTags(work.tags)}</div></td>
        <td><div class='count'>{work.post_count}</div></td>
        <td><div class='owner'>{work.author_name}</div></td>
      </tr>
    {/each}
  </table>
{:else}
  <center>Žádná díla nenalezena</center>
{/if}

<style>
  .headline {
    justify-content: space-between;
  }
  .mobile { display: none }
  .desktop { display: block }

  #works {
    margin-top: 50px;
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
      .name a {
        display: inline-block;
        width: 100%;
        height: 100%;
        padding: 20px;
      }
      .name a:first-letter {
        text-transform: uppercase;
      }

  center {
    padding: 50px;
  }

  @media (max-width: 860px) {
    .desktop { display: none }
    .mobile { display: block }
    .button {
      padding: 10px;
    }
  }
</style>