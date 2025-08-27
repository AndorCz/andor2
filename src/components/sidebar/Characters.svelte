<script>
  import { onMount } from 'svelte'
  import { isFilledArray } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'

  const { characters = { allGrouped: [], myStranded: [] }, openConversation, userStore } = $props()

  let selected = $state() // { character, gameIndex, characterIndex }
  // if there are more than 20 characters across all games and stranded, the lists will be collapsed by default
  const listTooLong = isFilledArray(characters.allGrouped) ? (characters.allGrouped.reduce((acc, game) => acc + game.characters.length, 0) + characters.myStranded.length) > 20 : false
  const expandedLists = $state({})
  let getPortraitUrl

  function portraitUrl (id, hash) {
    return getPortraitUrl ? getPortraitUrl(id, hash) : ''
  }

  onMount(async () => {
    ({ getPortraitUrl } = await import('@lib/database-browser'))
  })

  function openProfile (character) {
    window.location = `${window.location.origin}/game/character?id=${character.id}`
  }

  function containsCharacters (characters) {
    return $userStore.showDead ? isFilledArray(characters) : characters.some(character => character.state !== 'dead')
  }

  function toggleList (gameIndex) {
    expandedLists[gameIndex] = !expandedLists[gameIndex]
  }
</script>

{#if isFilledArray(characters.allGrouped) || isFilledArray(characters.myStranded)}
  {#if selected}
    <h4 class='row selected'>
      <button onclick={() => { selected = null }} class='material back'>chevron_left</button>
      <a href={`${window.location.origin}/game/character?id=${selected.character.id}`} class='character profile'>
        <div class='name'>{selected.character.name}</div>
      </a>
    </h4>
    <h4 class='header spaced'>Kontakty</h4>
    <ul class='characters'>
      {#if isFilledArray(characters.allGrouped[selected.gameIndex]?.characters[selected.characterIndex]?.contacts)}
        {#each characters.allGrouped[selected.gameIndex].characters[selected.characterIndex].contacts as character}
          {#if character.state !== 'dead' || $userStore.showDead}
            <button onclick={() => { openConversation({ us: selected.character, them: character, type: 'character' }) }}>
              {#if character.portrait}
                <img src={portraitUrl(character.id, character.portrait)} class='portrait' alt={character.name} />
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
        <h4 class='header'>
          <a href={'/game/' + id}>{name}</a>
          {#if listTooLong}
            {#if characters.some(character => character.unread)}<span class='unread badge'></span>{/if}
            <button onclick={() => toggleList(gameIndex)} class='material plain toggle' class:opened={expandedLists[gameIndex]}>arrow_drop_down</button>
          {/if}
        </h4>
        <ul class='characters hiddenList' class:expandedList={expandedLists[gameIndex] || !listTooLong}>
          {#if isFilledArray(characters)}
            {#each characters as character, characterIndex}
              {#if character.state !== 'dead' || $userStore.showDead}
                <li class='mine'>
                  <button onclick={() => { selected = { character, gameIndex, characterIndex } }}>
                    {#if character.portrait}
                      <img src={portraitUrl(character.id, character.portrait)} class='portrait' alt={character.name} />
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
        <h4 class='header'>
          <span>Bez hry</span>
          {#if listTooLong}
            {#if characters.myStranded.some(character => character.unread)}<span class='unread badge'></span>{/if}
            <button onclick={() => toggleList('stranded')} class='material plain toggle' class:opened={expandedLists.stranded}>arrow_drop_down</button>
          {/if}
        </h4>
        <ul class='characters hiddenList' class:expandedList={expandedLists.stranded || !listTooLong}>
          {#each characters.myStranded as character}
            {#if character.state !== 'dead' || $userStore.showDead}
              <li class='mine'>
                <button onclick={openProfile(character)}>
                  {#if character.portrait}
                    <img src={portraitUrl(character.id, character.portrait)} class='portrait' alt={character.name} />
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
    <button class='showDead material square' class:active={$userStore.showDead} onclick={() => { $userStore.showDead = !$userStore.showDead }} title={ $userStore.showDead ? 'Skrýt mrtvé' : 'Zobrazit mrtvé' } use:tooltip>skull</button>
  {:else}
    <div class='row'>
      <button class='showDead material square' class:active={$userStore.showDead} onclick={() => { $userStore.showDead = !$userStore.showDead }} title={ $userStore.showDead ? 'Skrýt mrtvé' : 'Zobrazit mrtvé' } use:tooltip>skull</button>
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
  h4.header {
    position: relative;
    display: flex;
    justify-content: space-between;
    color: var(--dim);
    margin: 0px;
  }
    h4 a {
      color: var(--dim);
      font-family: var(--headline);
    }
    h4 a:hover, h4 button:hover {
      color: var(--linkHover);
    }
    .selected {
      margin: 0px;
      margin-bottom: 10px;
    }
    .spaced {
      padding-top: 10px;
      padding-bottom: 10px;
    }
  ul.characters {
    list-style: none;
    padding: 0px;
    margin: 0px;
    margin-bottom: 10px;
  }
    ul.characters li:first-child {
      padding-top: 10px;
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
  .hiddenList {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.2s;
  }
  .expandedList {
    max-height: 500px;
    overflow: auto;
    transition: max-height 0.2s;
  }
  .badge {
    right: 5px;
    top: 5px;
  }
  .toggle:hover {
    color: var(--maximum);
  }
  .toggle {
    transition: transform 0.2s;
  }
  .toggle.opened {
    transform: rotate(180deg);
  }
</style>
