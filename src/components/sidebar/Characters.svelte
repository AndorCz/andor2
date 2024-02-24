<script>
  export let user = {}
  export let openChat
  export let gameCharacters = []
  export let strandedCharacters = []

  let selected

  function openEdit (character) { window.location = `/game/character-form?id=${character.id}` }
</script>

{#if selected}
  <h4>
    <button on:click={() => { selected = null }} class='material back'>chevron_left</button>
    <div class='name'>{selected.character.name}</div>
    <a href={`/game/character-form?game=${selected.character.game}&id=${selected.character.id}`} class='material edit'>edit</a>
  </h4>
  <ul class='characters'>
    {#each gameCharacters[selected.index].characters as character}
      {#if character.id !== selected.character.id && character.player !== user.id}
        <button on:click={() => { openChat(character.id, 'character') }}>
          {#if character.portrait}
            <img src={character.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='portrait gap'></span>
          {/if}
          <div class='name'>
            {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
            {character.name}
          </div>
        </button>
      {/if}
    {/each}
  </ul>
{:else}
  {#each gameCharacters as { id, name, characters }, index}
    <a href={'/game/' + id}><h4>{name}</h4></a>
    <ul class='characters'>
      {#each characters as character}
        {#if character.player === user.id}
          <li class='mine'>
            <button on:click={() => { selected = { index, character } }}>
              {#if character.portrait}
                <img src={character.portrait} class='portrait' alt='portrait'>
              {:else}
                <span class='portrait gap'></span>
              {/if}
              <span class='name character'>
                {#if character.storyteller}<span class='material star' title='Vypravěč'>star</span>{/if}
                {character.name}
              </span>
              <!--<span class='new'>{character.unread}</span>-->
              {#if character.active}<span class='status'></span>{/if}
            </button>
          </li>
        {/if}
      {/each}
    </ul>
  {/each}

  <h4>Bez hry</h4>

  {#if strandedCharacters.length === 0}
    <p>Žádné</p>
  {:else}
    <ul class='characters'>
      {#each strandedCharacters as character}
        <li class='mine'>
          <button on:click={openEdit(character)}>
            {#if character.portrait}
              <img src={character.portrait} class='portrait' alt='portrait'>
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
  {/if}
{/if}

<style>
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
      button:hover .new {
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
      .new {
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
</style>
