<script>
  import { supabase, handleError } from '@lib/database'
  import { userStore } from '@lib/stores'
  import Dropdown from '@components/common/Dropdown.svelte'

  $userStore.newsCategory = $userStore.newsCategory || 'games'

  const categories = {
    games: { label: 'Nové hry', slug: 'game' },
    boards: { label: 'Nové diskuze', slug: 'board' }
  }

  async function loadRecords () {
    const activeCategory = $userStore.newsCategory
    const { data, error } = await supabase.from(activeCategory).select('*')
    if (error) { handleError(error) }
    return data
  }

  function getUrl (id) {
    const slug = categories[$userStore.newsCategory].slug
    const { data } = supabase.storage.from('headers').getPublicUrl(`${slug}-${id}`)
    return data.publicUrl
  }
</script>

<h3 id='newsCategorySelect'>
  <Dropdown current={$userStore.newsCategory}
    options={Object.keys(categories).map(key => ({ value: key, label: categories[key].label }))}
    on:select={e => { $userStore.newsCategory = e.detail.value }}
  />
</h3>

{#key $userStore.newsCategory}
  {#await loadRecords() then records}
    {#each records as record}
      <a href={`/${categories[$userStore.newsCategory].slug}/${record.id}`} class='record'>
        <h2>{record.name}</h2>
        {#if record.custom_header}
          <img src={getUrl(record.id)} alt={record.name} />
        {/if}
        <p>{record.intro}</p>
      </a>
    {/each}
  {/await}
{/key}

<style>
  button.categoryOpen {
    background: none;
    border: none;
    box-shadow: none;
    font-size: inherit;
    font-family: inherit;
    padding: 0px;
  }
    button.categoryOpen span {
      font-size: 20px;
      padding: 5px;
    }

  .record {
    display: block;
  }
    .record img {
      max-width: 100%;
    }
    .record p {
      font-size: 16px;
      color: var(--dim);
      font-style: italic;
    }
</style>
