<script>
  import { onMount } from 'svelte'
  import { isFilledArray, addURLParam } from '@lib/utils'

  export let user = {}
  export let concepts = []
  export let page = 0
  export let maxPage = 20

  // functions to run only in the browser
  let getHeaderUrl = () => {}
  let getPortraitUrl = () => {}

  onMount(async () => {
    const databaseBrowser = await import('@lib/database-browser')
    getHeaderUrl = databaseBrowser.getHeaderUrl
    getPortraitUrl = databaseBrowser.getPortraitUrl
  })

  function triggerPaging (newPage) {
    const newUrl = addURLParam('page', newPage, true)
    window.location.href = newUrl
  }
</script>

<div class='headline flex'>
  <h1>Sólo rychlovky</h1>
  {#if user.id}
    <a href='./solo/solo-form' class='button desktop'>Vytvořit nový koncept</a>
    <a href='./solo/solo-form' class='button mobile material'>add</a>
  {/if}
</div>

{#if isFilledArray(concepts)}
  {#each concepts as concept}
    <div class='block'>
      {#if concept.custom_header}
        <div class='col image'>
          <img src={getHeaderUrl('solo', concept.id, concept.custom_header)} alt='solo header' />
        </div>
      {/if}
      <div class='col left'>
        <div class='name'><a href='./solo/{concept.id}'>{concept.name}</a></div>
        <div class='annotation'>{concept.annotation || ''}</div>
        <div class='meta'>
          <a href='./user?id={concept.author.id}' class='user author' title='autor'>
            {concept.author.name}
            {#if concept.author.portrait}<img src={getPortraitUrl(concept.author.id, concept.author.portrait)} class='icon' alt={concept.author.name} />{/if}
          </a>
        </div>
      </div>
    </div>
  {/each}
{:else}
  <p class='info'>Žádné herní koncepty nenalezeny</p>
{/if}

{#if maxPage > 0}
  <div class='pagination'>
    {#each { length: maxPage + 1 } as _, i}
      <button on:click={() => { triggerPaging(i) } } disabled={i === page}>{i + 1}</button>
    {/each}
  </div>
{/if}

<style>
  .info {
    padding: 20px;
    text-align: center;
  }
  .headline {
    justify-content: space-between;
  }
  .mobile { display: none }
  .desktop { display: block }

  .name a:first-letter {
    text-transform: uppercase;
  }

  .author {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
    .icon {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: cover;
      object-position: center 20%;
      border-radius: 100%;
      background-color: var(--background);
    }

  /* blocks */

  .block {
    background-color: var(--block);
    display: flex;
    flex-direction: row-reverse;
    margin-bottom: 5px;
    min-height: 115px;
  }
    .block .left {
      padding: 20px;
      padding-bottom: 10px;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
    }
      .block .name a {
        font-size: 22px;
      }
      .block .annotation {
        font-style: italic;
        padding: 5px 0px;
        color: var(--dim);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .block .meta {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 20px;
      }
    .block .image {
      width: 30%;
      overflow: hidden;
    }
      .block .image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

  /*
  .pagination {
    text-align: center;
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 18px;
      padding: 0px;
      width: 40px;
      height: 40px;
    }
  */

  @media (max-width: 1200px) {
    .block .name {
      flex-basis: 100%;
    }
  }

  @media (max-width: 860px) {
    h1 { padding-left: 10px }
    .desktop { display: none }
    .mobile { display: block }
    .headline .button {
      padding: 10px;
    }
  }

  @media (max-width: 500px) {
    .block {
      display: block;
      margin-bottom: 10px;
    }
    .block .left { padding: 15px 10px }
    .block .image { width: 100% }
    .headline .button {
      padding: 7px;
    }
  }
</style>
