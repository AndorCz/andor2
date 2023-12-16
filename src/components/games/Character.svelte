<script>
  import { supabase, handleError } from '@lib/database'

  export let character
  export let user
  export let isGameOwner
  
  const isOwner = character.owner.id === user.id
  // const isPlayer = character.profiles.id === user.id

  async function acceptCharacter (id) {
    const { error } = await supabase.from('characters').update({ accepted: true, open: false }).eq('id', id)
    if (error) { handleError(error) }
    else { window.location.href = `./?toastType=success&toastText=`  + encodeURIComponent('Postava byla přijata') }
  }
  async function rejectCharacter (id) {
    const { error } = await supabase.from('characters').update({ game: null }).eq('id', id)
    if (error) { handleError(error) }
    else { window.location.href = `./?toastType=success&toastText=`  + encodeURIComponent('Postava byla odmítnuta') }
  }
</script>

<li class='char'>
  {#if character.portrait}
    <img src={character.portrait} class='portrait' alt='portrét postavy'>
  {/if}
  <div class='name'>
    {#if isGameOwner || isOwner}
      <a href='./character-form?id={character.id}'>{character.name}</a>
    {:else}
      {character.name}
    {/if}
  </div>
  {#if isGameOwner}
    <div class='player'>Vlastník: <b>{character.owner.name}</b></div>
    <div class='player'>Hráč: <b>{character.player.name}</b></div>
    {#if !character.accepted}
      <button on:click={() => acceptCharacter(character.id)}>přijmout</button>
      <button on:click={() => rejectCharacter(character.id)}>odmítnout</button>
    {/if}
  {/if}
</li>

<style>
  .char {
    list-style: none;
    display: flex;
    align-items: center;
    background-color: var(--block);
    margin-left: 0px;
    margin-bottom: 2px;
    padding: 10px;
  }
  .portrait {
    width: 60px;
  }
  .name {
    padding-left: 20px;
    flex: 1;
  }
    .name a {
      font-size: 16pt;
    }
  .player {
    margin-right: 20px;
  }
  button {
    margin: 5px;
  }
</style>