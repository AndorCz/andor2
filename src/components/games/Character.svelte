<script>
  import { supabase, handleError } from '@lib/database'

  export let user
  export let gameId
  export let character
  export let isGameOwner

  const isPlayer = character.player.id === user.id

  async function acceptCharacter (id) {
    const { error } = await supabase.from('characters').update({ accepted: true, open: false }).eq('id', id)
    if (error) { return handleError(error) }

    // update timestamp
    const { error: timestampError } = await supabase.from('games').update({ characters_changed_at: new Date() }).eq('id', gameId)
    if (timestampError) { return handleError(timestampError) }

    // add bookmark to the user of the accepted character
    const { error: bookmarkError } = await supabase.from('bookmarks').insert({ user_id: character.player.id, game_id: gameId })
    if (bookmarkError) { return handleError(bookmarkError) }

    window.location.href = window.location.href + '/?toastType=success&toastText=' + encodeURIComponent('Postava byla přijata')
  }
  async function rejectCharacter (id) {
    const { error } = await supabase.from('characters').update({ game: null }).eq('id', id)
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent('Postava byla odmítnuta')
  }
</script>

<tr class='character'>
  <td class='portrait'>
    {#if character.portrait}
      <img src={character.portrait} class='portrait' alt='portrét postavy'>
    {/if}
  </td>
  <td class='name'>
    {#if character.storyteller}
      <span class='material star' title='Vypravěč'>star</span>
    {/if}
    {#if isGameOwner || isPlayer}
      <a href={window.location.href + '/character-form?id=' + character.id}>{character.name}</a>
    {:else}
      {character.name}
    {/if}
  </td>
  {#if isGameOwner}
    <td class='player'>{character.player.name}</td>
    <td class='options'>
      {#if !character.accepted}
        <div class='accept'>
          <button on:click={() => acceptCharacter(character.id)}>přijmout</button>
          <button on:click={() => rejectCharacter(character.id)}>odmítnout</button>
        </div>
      {/if}
    </td>
  {/if}
</tr>

<style>
  .character {
    margin-bottom: 2px;
    padding: 10px;
  }
    td {
      vertical-align: middle;
    }
    .portrait {
      width: 60px;
      min-width: 60px;
      padding: 0px;
    }
      .portrait img {
        display: block;
      }
    .name {
      width: 100%;
      vertical-align: middle;
    }
      .name .star {
        color: var(--accent);
        font-size: 17px;
        margin-right: 5px;
      }

    .name, .player {
      background-color: var(--block);
      padding: 15px;
      min-width: 100px;
    }
      .name a {
        font-size: 22px;
      }
      .accept {
        display: flex;
        gap: 10px;
        height: 100%;
      }
        .accept button {
          padding: 10px;
        }
    .options {
      padding-left: 10px;
    }
    .player {
      margin-right: 20px;
      font-weight: bold;
    }
</style>
