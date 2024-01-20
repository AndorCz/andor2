<script>
  import { supabase, handleError } from '@lib/database'

  // 2DO: use userStore and implement custom select
  let activeCategory = 'games'

  const categories = {
    games: { label: 'Nové hry', slug: 'game' },
    boards: { label: 'Nové diskuze', slug: 'board' }
  }

  async function loadRecords () {
    const { data, error } = await supabase.from(activeCategory).select('*')
    if (error) { handleError(error) }
    return data
  }

  function getUrl (id) {
    const { data } = supabase.storage.from('headers').getPublicUrl(`${categories[activeCategory].slug}-${id}`)
    return data.publicUrl
  }
</script>

<h3><button class='categoryOpen'>{categories[activeCategory].label} <span>⧨</span></button></h3>

{#key activeCategory}
  {#await loadRecords() then records}
    {#each records as record}
      <a href={`/${categories[activeCategory].slug}/${record.id}`} class='record'>
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
