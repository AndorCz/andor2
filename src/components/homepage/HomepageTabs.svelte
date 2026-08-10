<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import NewsFeed from '@components/homepage/NewsFeed.svelte'
  import Wall from '@components/Wall.svelte'

  const { user = {}, news = [], wall = [], showcasePost, newsPage = 0, newsMaxPage = 0, wallPage = 0, wallMaxPage = 0 } = $props()

  const storageKey = 'homepage-active-tab'
  let activeTab = $state('news')

  onMount(() => {
    const savedTab = window.localStorage.getItem(storageKey)
    if (savedTab === 'news' || savedTab === 'wall') { activeTab = savedTab }
  })

  function switchTab (tab) {
    activeTab = tab
    window.localStorage.setItem(storageKey, tab)
  }
</script>

<nav class='tabs secondary homepage-tabs'>
  <button class:active={activeTab === 'news'} onclick={() => switchTab('news')}>Upoutávky</button>
  <button class:active={activeTab === 'wall'} onclick={() => switchTab('wall')}>Zeď</button>
  {#if activeTab === 'news'}
    <a href='https://andor2.cz/board/35' class='material info' title='Chceš propagovat hru, diskuzi, či dílo? Popiš svoji představu do diskuze "Zadání upoutávky", kam tě vezme kliknutí na tuto ikonku.' use:tooltip>info</a>
  {/if}
</nav>

{#if activeTab === 'news'}
  <NewsFeed {user} {news} {showcasePost} page={newsPage} maxPage={newsMaxPage} showHeadline={false} />
{:else}
  <Wall {user} items={wall} page={wallPage} maxPage={wallMaxPage} />
{/if}

<style>
  .homepage-tabs {
    display: flex;
    align-items: center;
    /* SecondaryTabs draw a 10px strip below the nav; leave 20px after it. */
    margin-bottom: 30px;
  }
  .homepage-tabs .info {
    margin-left: auto;
    padding: 8px;
  }
</style>
