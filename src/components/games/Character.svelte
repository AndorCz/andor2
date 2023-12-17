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

<tr class='character'>
  <td class='portrait'>
    {#if character.portrait}
      <img src={character.portrait} class='portrait' alt='portrét postavy'>
    {/if}
  </td>
  <td class='name'>
    {#if isGameOwner || isOwner}
      <a href='./character-form?id={character.id}'>{character.name}</a>
    {:else}
      {character.name}
    {/if}
  </td>
  {#if isGameOwner}
    <td class='owner'>{character.owner.name}</td>
    <td class='player'>{character.player.name}</td>
    <td class='tools'>
      {#if !character.accepted}
        <button on:click={() => acceptCharacter(character.id)}>přijmout</button>
        <button on:click={() => rejectCharacter(character.id)}>odmítnout</button>
      {/if}
    </td>
  {/if}
</tr>

<style>
  .character {
    background-color: var(--block);
    margin-bottom: 2px;
    padding: 10px;
  }
    td {
      vertical-align: middle;
    }
    .portrait {
      width: 60px;
    }
      .portrait img {
        display: block;
      }
    .name {
      width: 100%;
    }
    .name, .owner, .player, .tools {
      padding: 15px;
      min-width: 100px;
    }
      .name a {
        font-size: 16pt;
      }
    .owner, .player {
      margin-right: 20px;
      font-weight: bold;
    }
  button {
    margin: 5px;
  }
</style>