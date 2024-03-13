<script>
  import { getPortrait } from '@lib/database'
  import { isFilledArray } from '@lib/utils'

  export let characters = { allGrouped: [], myStranded: [] }
  export let openConversation

  let selected // { character, gameIndex, characterIndex }

  function openEdit (character) { window.location = `/game/character-form?id=${character.id}` }
</script>

{#if selected}
  <h4>
    <button on:click={() => { selected = null }} class='material back'>chevron_left</button>
    <div class='name'>{selected.character.name}</div>
    <a href={`/game/character-form?game=${selected.character.game}&id=${selected.character.id}`} class='material edit'>edit</a>
  </h4>
  <ul class='characters'>
    {#if isFilledArray(characters.allGrouped[selected.gameIndex]?.characters[selected.characterIndex]?.contacts)}
      {#each characters.allGrouped[selected.gameIndex].characters[selected.characterIndex].contacts as character}
        <button on:click={() => { openConversation({ us: selected.character, them: character, type: 'character' }) }}>
          {#if character.portrait}
            {#await getPortrait(character.id, character.portrait) then url}<img src={url} class='portrait' alt={character.name} />{/await}
          {:else}
            <span class='portrait gap'></span>
          {/if}
          <div class='name character'>
            {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
            {character.name}
          </div>
          {#if character.unread}<span class='unread'>{character.unread}</span>{/if}
          {#if character.active}<span class='status'></span>{/if}
        </button>
      {/each}
    {:else}
      <div class='empty'>Hra nemá další postavy</div>
    {/if}
  </ul>
{:else}
  {#if isFilledArray(characters.allGrouped)}
    {#each characters.allGrouped as { id, name, characters }, gameIndex}
      <a href={'/game/' + id}><h4>{name}</h4></a>
      <ul class='characters'>
        {#if isFilledArray(characters)}
          {#each characters as character, characterIndex}
            <li class='mine'>
              <button on:click={() => { selected = { character, gameIndex, characterIndex } }}>
                {#if character.portrait}
                  {#await getPortrait(character.id, character.portrait) then url}<img src={url} class='portrait' alt={character.name} />{/await}
                {:else}
                  <span class='portrait gap'></span>
                {/if}
                <span class='name character'>
                  {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
                  {character.name}
                </span>
                {#if character.unread}<span class='unread'>{character.unread}</span>{/if}
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    {/each}
  {:else}
    <div class='empty'>Žádné postavy</div>
  {/if}

  <h4>Bez hry</h4>

  {#if isFilledArray(characters.myStranded)}
    <ul class='characters'>
      {#each characters.myStranded as character}
        <li class='mine'>
          <button on:click={openEdit(character)}>
            {#if character.portrait}
              {#await getPortrait(character.id, character.portrait) then url}<img src={url} class='portrait' alt={character.name} />{/await}
            {:else}
              <span class='portrait gap'></span>
            {/if}
            <span class='name character'>
              {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
              {character.name}
            </span>
            {#if character.active}<span class='status'></span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class='empty'>Žádné postavy</div>
  {/if}
{/if}

<a href='/game/character-form' class='button newChar'>Vytvořit postavu</a>

<style>
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
  h4 {
    color: var(--dim);
    margin: 0px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }
    a:hover h4 {
      color: var(--linkHover);
    }
  ul.characters {
    list-style: none;
    padding: 0px;
    margin: 0px;
    margin-bottom: 10px;
  }
    button {
      position: relative;
      font-weight: bold;
      background: none;
      border: 0px;
      padding: 5px;
      padding-left: 0px;
      display: block;
      color: var(--link);
      width: 100%;
      text-align: left;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
      button:hover .portrait {
        transform: scale(1.1);
      }
      button:hover .name {
        color: var(--characterHover);
      }
      button:hover .unread {
        color: var(--maximum);
      }
      .name {
        flex: 1;
      }
        .name .star {
          font-size: 17px;
          margin-right: 5px;
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
      .unread {
        color: var(--new);
        pointer-events: none;
      }
      .back {
        display: inline;
        width: initial;
        color: var(--link);
        padding: 0px;
        padding-right: 10px;
        border: none;
        background: none;
        box-shadow: none;
      }
        .back:hover {
          color: var(--linkHover);
        }
      .edit {
        font-size: 20px;
      }
      .newChar {
        margin: 10px auto;
        display: block;
        width: fit-content;
      }
</style>
