<script>
  import { tooltip } from '@lib/tooltip'

  export let news = []

  const subHeadline = {
    game: 'Nová hra',
    work: 'Nové dílo',
    board: 'Nová diskuze'
  }
  const path = {
    game: '/game/',
    work: '/work/',
    board: '/board/'
  }
</script>

<div id='news'>
  <h3>Reklamy<a href='https://andor2.cz/board/35' class='material' title='Zde bude jedna nová reklama či novinka každý den. Chceš propagovat svojí hru, diskuzi, či dílo? Klikni zde a popiš svojí představu do diskuze "Poptávka reklamy".' use:tooltip>info</a></h3>
  {#each news as item}
    <div class='item'>
      {#if item.image_url}
        <img src={item.image_url} alt='Upoutávka' />
      {/if}
      {#if subHeadline[item.content_type] || item.subheadline}
        <h4>{subHeadline[item.content_type] || item.subheadline}</h4>
      {/if}
      {#if item.content_id}
        <a href={path[item.content_type] + item.content_id}><h2>{item.title}</h2></a>
      {:else}
        <h2>{item.title}</h2>
      {/if}
      <p>{item.content}</p>
    </div>
  {/each}
</div>

<style>
  h3 {
    margin-top: 0px;
    display: flex;
    justify-content: space-between;
  }
  .item {
    padding: 20px;
    background-color: var(--block);
  }
    .item p {
      margin-bottom: 0px;
    }
    .item h2 {
      margin: 0px;
    }
    .item h4 {
      margin: 0px;
    }
</style>
