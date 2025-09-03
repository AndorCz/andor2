<script>
  import { tooltip } from '@lib/tooltip'
  import NewsItem from '@components/homepage/NewsItem.svelte'

  const { news = [], user = {}, page = 0, maxPage = 2 } = $props()

  function triggerPaging (newPage) {
    window.location = `/?page=${newPage}`
  }
</script>

<div id='news'>
  <h3>Upoutávky<a href='https://andor2.cz/board/35' class='material' title='Chceš propagovat hru, diskuzi, či dílo? Popiš svoji představu do diskuze "Zadání upoutávky", kam tě vezme kliknutí na tuto ikonku.' use:tooltip>info</a></h3>
  {#each news as item (item.id)}
    <NewsItem {user} {item} />
  {/each}
  <div class='pagination'>
    {#if page > 0}
      <button onclick={() => { triggerPaging(page - 1) }}>Novější</button>
    {/if}
    {#if page < maxPage}
      <button onclick={() => { triggerPaging(page + 1) }}>Starší</button>
    {/if}
  </div>
</div>

<style>
  h3 {
    margin-top: 0px;
    display: flex;
    justify-content: space-between;
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 40px;
  }
</style>
