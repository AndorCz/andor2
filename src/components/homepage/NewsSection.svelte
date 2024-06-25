<script>
  import { supabase, getHeaderUrl, getPortraitUrl } from '@lib/database-browser'

  export let headline = 'Nové hry'
  export let slug = 'game'
  export let table = 'game_list'

  async function loadData () {
    const query = supabase.from(table).select('*').eq('published', true)
    if (slug === 'work') {
      query.not('editorial', 'eq', true)
    } else if (slug === 'board') {
      query.eq('open', true)
    }
    const { data, error } = await query.order('created_at', { ascending: false }).limit(5)
    if (error) { throw new Error('Nepodařilo se načíst novinky. Důvod: ' + error.message) }
    return data
  }

  function limitLength (text, length) {
    return text.length > length ? text.slice(0, length) + '...' : text
  }
</script>

{#await loadData()}
  Načítám novinky
{:then items}
  <div id='news'>
    <h3>{headline}</h3>
    {#each items as item}
      <div class='item'>
        {#if item.custom_header}
          <img src={getHeaderUrl(slug, item.id, item.custom_header)} alt={item.name} class='image' />
        {/if}
        <main>
          <a href={`/${slug}/${item.id}`} class='name'><h2>{item.name}</h2></a>
          {#if item.annotation}
            <p class='annotation'>{limitLength(item.annotation, 150)}</p>
          {/if}
          <div class='details'>
            <span class='date'>{new Date(item.created_at).toLocaleDateString('cs')}</span>
            <a href={'/user?id=' + item.owner} class='user'>
              <span>{item.owner_name}</span>
              {#if item.owner_portrait}
                <img src={getPortraitUrl(item.owner, item.owner_portrait)} class='portrait' alt={item.owner_name} />
              {/if}
            </a>
          </div>
        </main>
      </div>
    {/each}
  </div>
{:catch error}
  <p>{error.message}</p>
{/await}

<style>
  h3 {
    margin: 10px 0px;
    font-size: 20px;
  }
  #news {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
    .item {
      display: flex;
      flex-direction: column;
    }
      .item .image {
        max-width: 100%;
        max-height: 50px;
        display: block;
        object-fit: cover;
      }
      main {
        flex: 1;
        background-color: var(--block);
        padding: 20px;
        padding-bottom: 10px;
      }
        .name {
          display: block;
        }
          .name h2 {
            margin-top: 0px;
            margin-bottom: 10px;
            font-size: 22px;
            line-height: 120%;
          }
        .annotation {
          font-size: 17px;
          font-style: italic;
          font-variation-settings: 'wght' 400;
          margin: 5px 0px;
        }
          .details {
            display: flex;
            justify-content: space-between;
          }
          .date {
            display: flex;
            align-items: center;
            font-size: 16px;
            color: var(--dim);
          }
          .user {
            display: flex;
            align-items: center;
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
</style>
