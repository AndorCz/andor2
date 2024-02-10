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
    const { data, error } = await supabase.from(activeCategory).select('*').order('created_at').limit(5)
    if (error) { handleError(error) }
    return data
  }

  function getUrl (id) {
    const slug = categories[$userStore.newsCategory].slug
    const { data } = supabase.storage.from('headers').getPublicUrl(`${slug}-${id}`)
    return data.publicUrl
  }

  function limitLength (text, length) {
    return text.length > length ? text.slice(0, length) + '...' : text
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
        <p>{limitLength(record.annotation, 150)}</p>
      </a>
    {/each}
  {/await}
{/key}

<style>
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
