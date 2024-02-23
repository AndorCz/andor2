<script>
  export let user = {}
  export let openChat
  export let allGroupedCharacters = {}
  export let myStrandedCharacters = []
</script>

<div class='legend'>
  <span>Cizí</span>
  <span>Moje</span>
</div>

{#each allGroupedCharacters as { id, name, characters }}
  <a href={'/game/' + id}><h4>{name}</h4></a>
  <ul class='characters'>
    {#each characters as character}
      <li class:mine={character.player === user.id}>
        <button on:click={() => openChat(character)}>
          {#if character.portrait}
            <img src={character.portrait} class='portrait' alt='portrait'>
          {:else}
            <span class='gap'></span>
          {/if}
          <span class='name'>{character.name}</span>
          <!--<span class='new'>{character.unread}</span>-->
          {#if character.active}<span class='status'></span>{/if}
        </button>
      </li>
    {/each}
  </ul>
{/each}

<h4>Moje bez hry</h4>

<ul class='characters'>
  {#each myStrandedCharacters as character}
    <li class='mine'>
      <button on:click={() => openChat(character)}>
        {#if character.portrait}
          <img src={character.portrait} class='portrait' alt='portrait'>
        {:else}
          <span class='gap'></span>
        {/if}
        <span class='name'>{character.name}</span>
        {#if character.active}<span class='status'></span>{/if}
      </button>
    </li>
  {/each}
</ul>

<style>
  .legend {
    display: flex;
    justify-content: space-between;
    color: var(--dim);
    font-size: 14px;
    font-style: italic;
  }
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
    li.mine button {
      flex-direction: row-reverse;
      text-align: right;
    }
    ul button {
      position: relative;
      font-weight: bold;
      background: none;
      border: 0px;
      padding: 5px;
      display: block;
      width: 100%;
      text-align: left;
      box-shadow: none;
      color: var(--link);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
      button:hover {
        color: var(--maximum);
      }
      button:hover .new {
        color: var(--maximum);
      }
      .name {
        flex: 1;
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
