<script>
  import NewsItem from '@components/homepage/NewsItem.svelte'

  const { news = [], user = {}, showcasePost, page = 0, maxPage = 2, showHeadline = true } = $props()

  function triggerPaging (newPage) {
    const params = new URLSearchParams(window.location.search)
    if (newPage > 0) { params.set('newsPage', newPage) } else { params.delete('newsPage') }
    window.location = `/?${params.toString()}`
  }
</script>

<div id='news'>
  {#if showHeadline}<h3>Upoutávky</h3>{/if}
  {#if showcasePost}
    <NewsItem {user} item={showcasePost} reactionType='post' flushBottom />
  {/if}
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
