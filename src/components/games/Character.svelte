<script>
  import { supabase, handleError, getPortrait } from '@lib/database'

  export let user
  export let gameId
  export let character
  export let isGameOwner
  export let isStoryteller

  const isPlayer = character.player.id === user.id

  async function charactersChanged (event) {
    const { error: timestampError } = await supabase.from('games').update({ characters_changed_at: new Date() }).eq('id', gameId)
    if (timestampError) { return handleError(timestampError) }
  }

  async function acceptCharacter (id) {
    const { error } = await supabase.from('characters').update({ accepted: true, open: false }).eq('id', id)
    if (error) { return handleError(error) }
    await charactersChanged()

    // add bookmark to the user of the accepted character
    const { error: bookmarkError } = await supabase.from('bookmarks').upsert({ user_id: character.player.id, game_id: gameId }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
    if (bookmarkError) { return handleError(bookmarkError) }

    window.location.href = window.location.href + '/?toastType=success&toastText=' + encodeURIComponent('Postava byla přijata')
  }
  async function rejectCharacter (id, own = false) {
    if (!window.confirm(own ? 'Opravdu zrušit přihlášení?' : 'Opravdu odmítnout postavu?')) { return }
    const { error } = await supabase.from('characters').update({ game: null, accepted: false }).eq('id', id)
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent(own ? 'Přihláška byla zrušena' : 'Postava byla vyřazena ze hry')
  }
  async function freeCharacter (id) {
    if (!window.confirm('Opravdu dát na seznam volných postav? (bude předána jinému hráči)')) { return }
    const { error } = await supabase.from('characters').update({ open: true }).eq('id', id)
    await charactersChanged()
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent('Postava byla uvolněna')
  }
  async function claimCharacter (id) {
    if (!window.confirm('Opravdu převzít postavu?')) { return }
    const { error } = await supabase.from('characters').update({ open: false, player: user.id }).eq('id', id)
    await charactersChanged()
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent('Postava byla převzata')
  }
</script>

<tr class='character'>
  <td class='portrait'>
    {#if character.portrait}
      {#await getPortrait(character.id, character.portrait) then url}<img src={url} class='portrait' alt='portrét postavy' />{/await}
    {/if}
  </td>
  <td class='name'>
    {#if character.storyteller}
      <span class='material star' title='Vypravěč'>star</span>
    {/if}
    {#if isPlayer}
      <a href={`${window.location.origin}/game/character-form?game=${gameId}&id=${character.id}`} class='character'>{character.name}</a>
    {:else if isStoryteller}
      <a href={`${window.location.origin}/game/character?id=${character.id}`} class='character'>{character.name}</a>
    {:else}
      {character.name}
    {/if}
  </td>
  {#if isGameOwner}
    <td class='player'><a href={'/user?id=' + character.player.id} class='user'>{character.player.name}</a></td>
  {/if}
  <td>
    {#if isStoryteller || !character.accepted || character.open}
      <div class='options'>
        {#if isStoryteller}
          {#if character.accepted}
            <button on:click={() => rejectCharacter(character.id)}>vyloučit</button>
            {#if !character.open}
              <button on:click={() => freeCharacter(character.id)}>uvolnit</button>
            {/if}
          {:else}
            <button on:click={() => acceptCharacter(character.id)}>přijmout</button>
            <button on:click={() => rejectCharacter(character.id)}>odmítnout</button>
          {/if}
        {/if}
        {#if isPlayer && !character.accepted && !isStoryteller}
          <button on:click={() => rejectCharacter(character.id, true)}>zrušit</button>
        {/if}
        {#if character.open}
          <button on:click={() => claimCharacter(character.id)}>převzít</button>
        {/if}
      </div>
    {/if}
  </td>
</tr>

<style>
  .character {
    margin-bottom: 2px;
    padding: 10px;
  }
    td {
      vertical-align: middle;
      background-color: var(--block);
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
        font-size: 17px;
        margin-right: 5px;
      }

    .name, .player {
      padding: 15px;
      min-width: 100px;
    }
      .name a {
        font-size: 22px;
      }
    .options {
      display: flex;
      gap: 10px;
      height: 100%;
      padding: 0px 5px;
    }
      .options button {
        padding: 10px;
      }
    .player {
      margin-right: 20px;
      font-weight: bold;
    }
</style>
