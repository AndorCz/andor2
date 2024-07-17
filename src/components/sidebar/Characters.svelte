<script>
  import { getPortraitUrl } from '@lib/database-browser'
  import { isFilledArray } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'

  export let characters = { allGrouped: [], myStranded: [] }
  export let openConversation
  export let userStore

  let selected // { character, gameIndex, characterIndex }

  function openProfile (character) {
    window.location = `${window.location.origin}/game/character?id=${character.id}`
  }

  function containsCharacters (characters) {
    return $userStore.showDead ? isFilledArray(characters) : characters.some(character => character.state !== 'dead')
  }
</script>

{#if isFilledArray(characters.allGrouped) || isFilledArray(characters.myStranded)}
  {#if selected}
    <h4 class='row selected'>
      <button on:click={() => { selected = null }} class='material back'>chevron_left</button>
      <a href={`${window.location.origin}/game/character?id=${selected.character.id}`} class='character profile'>
        <div class='name'>{selected.character.name}</div>
      </a>
    </h4>
    <ul class='characters'>
      {#if isFilledArray(characters.allGrouped[selected.gameIndex]?.characters[selected.characterIndex]?.contacts)}
        <h4>Kontakty</h4>
        {#each characters.allGrouped[selected.gameIndex].characters[selected.characterIndex].contacts as character}
          {#if character.state !== 'dead' || $userStore.showDead}
            <button on:click={() => { openConversation({ us: selected.character, them: character, type: 'character' }) }}>
              {#if character.portrait}
                <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt={character.name} />
              {:else}
                <span class='portrait gap'></span>
              {/if}
              <div class='name character' class:dead={character.state === 'dead'}>
                {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
                {#if character.state === 'dead'}<span class='material skull' title='Mrtvolka'>skull</span>{/if}
                {character.name}
              </div>
              {#if character.unread}<span class='unread'>{character.unread}</span>{/if}
              {#if character.active}<span class='status'></span>{/if}
            </button>
          {/if}
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
              {#if character.state !== 'dead' || $userStore.showDead}
                <li class='mine'>
                  <button on:click={() => { selected = { character, gameIndex, characterIndex } }}>
                    {#if character.portrait}
                      <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt={character.name} />
                    {:else}
                      <span class='portrait gap'></span>
                    {/if}
                    <span class='name character' class:dead={character.state === 'dead'}>
                      {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
                      {#if character.state === 'dead'}<span class='material skull' title='Mrtvolka'>skull</span>{/if}
                      {character.name}
                    </span>
                    {#if character.unread}<span class='unread'>{character.unread}</span>{/if}
                  </button>
                </li>
              {/if}
            {/each}
          {/if}
        </ul>
        <hr>
      {/each}
    {:else}
      <div class='empty'>Žádné postavy</div>
    {/if}

    {#key $userStore.showDead}
      {#if containsCharacters(characters.myStranded)}
        <h4>Bez hry</h4>
        <ul class='characters'>
          {#each characters.myStranded as character}
            {#if character.state !== 'dead' || $userStore.showDead}
              <li class='mine'>
                <button on:click={openProfile(character)}>
                  {#if character.portrait}
                    {#await getPortraitUrl(character.id, character.portrait) then url}<img src={url} class='portrait' alt={character.name} />{/await}
                  {:else}
                    <span class='portrait gap'></span>
                  {/if}
                  <span class='name character' class:dead={character.state === 'dead'}>
                    {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
                    {#if character.state === 'dead'}<span class='material skull' title='Mrtvolka'>skull</span>{/if}
                    {character.name}
                  </span>
                  {#if character.active}<span class='status'></span>{/if}
                </button>
              </li>
            {/if}
          {/each}
        </ul>
      {/if}
    {/key}
  {/if}
{:else}
  <div class='empty'>Žádné postavy</div>
{/if}
<div class='bottom'>
  {#if selected}
    <button class='showDead material square' class:active={$userStore.showDead} on:click={() => { $userStore.showDead = !$userStore.showDead }} title={ $userStore.showDead ? 'Skrýt mrtvé' : 'Zobrazit mrtvé' } use:tooltip>skull</button>
  {:else}
    <div class='row'>
      <button class='showDead material square' class:active={$userStore.showDead} on:click={() => { $userStore.showDead = !$userStore.showDead }} title={ $userStore.showDead ? 'Skrýt mrtvé' : 'Zobrazit mrtvé' } use:tooltip>skull</button>
      <a href='/game/character-form' class='button newChar'>Vytvořit postavu</a>
    </div>
  {/if}
</div>

<style>
  .row {
    display: flex;
    justify-content: space-between;
  }
  .empty {
    padding: 20px 0px;
    text-align: center;
    color: var(--dim);
    font-style: italic;
  }
  hr {
    margin: 20px -20px;
    border: none;
    border-top: 1px solid var(--background);
  }
  h4 {
    color: var(--dim);
    margin: 0px;
    margin-bottom: 10px;
    display: inline-block;
    align-items: center;
  }
    a:hover h4 {
      color: var(--linkHover);
    }
    .selected {
      margin-bottom: 20px;
    }
  ul.characters {
    list-style: none;
    padding: 0px;
    margin: 0px;
    margin-bottom: 0px;
  }
    ul button {
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
      ul button:hover .portrait {
        transform: scale(1.1);
      }
      ul button:hover .name {
        color: var(--characterHover);
      }
      ul button:hover .unread {
        color: var(--maximum);
      }
      .name {
        flex: 1;
      }
        .name .star, .name .skull {
          font-size: 17px;
          margin-right: 5px;
          transform: translateY(2px);
        }
      .dead {
        text-decoration: line-through;
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
      .profile {
        font-family: var(--font);
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        font-size: 25px;
      }
      .bottom {
        padding-top: 20px;
      }
        .newChar {
          display: block;
          width: fit-content;
        }
</style>
