<script>
  import { tooltip } from '@lib/tooltip'
  import NewsItem from '@components/homepage/NewsItem.svelte'

  export let news = []
  export let user = {}
</script>

<div id='news'>
  <h3>Upoutávky<a href='https://andor2.cz/board/35' class='material' title='Chceš propagovat svojí hru, diskuzi, či dílo? Popiš svojí představu do diskuze "Zadání upotávky", kam tě vezme kliknutí na tuto ikonku.' use:tooltip>info</a></h3>
  {#each news as item}
    <NewsItem {user} {item} />
  {/each}
</div>

<style>
  h3 {
    margin-top: 0px;
    display: flex;
    justify-content: space-between;
  }
</style>
