<script>
  export let user = {}
  export let openChat
  export let allGroupedCharacters = {}
  export let myStrandedCharacters = []
</script>

{#each allGroupedCharacters as { id, name, characters }}
  <a href={'/game/' + id}><h4>{name}</h4></a>
  <ul class='characters'>
    {#each characters as character}
      {#if character.player === user.id}
        <li class='mine'>
          <a href='#' class='button'>
            {#if character.portrait}
              <img src={character.portrait} class='portrait' alt='portrait'>
            {:else}
              <span class='gap'></span>
            {/if}
            <span class='name character'>
              {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
              {character.name}<span class='note'>(moje)</span>
            </span>
            <!--<span class='new'>{character.unread}</span>-->
            {#if character.active}<span class='status'></span>{/if}
          </a>
        </li>
      {:else}
        <li class='other'>
          <button on:click={() => openChat(character)}>
            {#if character.portrait}
              <img src={character.portrait} class='portrait' alt='portrait'>
            {:else}
              <span class='gap'></span>
            {/if}
            <span class='name character'>
              {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
              {character.name}
            </span>
            <span class='new'>{character.unread || ''}</span>
            {#if character.active}<span class='status'></span>{/if}
          </button>
        </li>
      {/if}
    {/each}
  </ul>
{/each}

<h4>Moje bez hry</h4>

{#if myStrandedCharacters.length === 0}
  <p>Žádné</p>
{:else}
  <ul class='characters'>
    {#each myStrandedCharacters as character}
      <li class='mine'>
        <a href='#' class='button'>
          {#if character.portrait}
            <img src={character.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='gap'></span>
          {/if}
          <span class='name character'>
            {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
            {character.name}
          </span>
          {#if character.active}<span class='status'></span>{/if}
        </a>
      </li>
    {/each}
  </ul>
{/if}

<style>
  h4 {
    color: var(--dim);
    margin: 10px 0px;
  }
    a:hover h4 {
      color: var(--maximum);
    }
  ul {
    list-style: none;
    padding: 0px;
    margin: 0px;
  }
    ul button, ul .button {
      position: relative;
      font-weight: bold;
      background: none;
      border: 0px;
      padding: 5px;
      padding-left: 0px;
      display: block;
      width: 100%;
      text-align: left;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
      .button {
        color: var(--link);
      }
        button:hover .name, a.button:hover .name {
          color: var(--maximum);
        }
        button:hover .new, a.button:hover .new {
          color: var(--maximum);
        }
        .name {
          flex: 1;
        }
          .name .star {
            font-size: 17px;
            margin-right: 5px;
          }
          .name .note {
            font-size: 14px;
            color: var(--dim);
            margin-left: 5px;
            font-variation-settings: 'wght' 200;
          }
      .portrait, .gap {
        display: block;
        width: 40px;
        height: 40px;
        object-fit: cover;
        object-position: center 20%;
        border-radius: 100%;
        background-color: var(--background);
      }
      .new {
        color: var(--new);
        pointer-events: none;
      }
</style>
