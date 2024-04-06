<script>
  import { supabase, handleError, getPortrait } from '@lib/database'
  import { tooltip } from '@lib/tooltip'

  export let user
  export let game
  export let character
  export let isStoryteller

  const isPlayer = character.player.id === user.id

  async function charactersChanged (event) {
    const { error: timestampError } = await supabase.from('games').update({ characters_changed_at: new Date() }).eq('id', game.id)
    if (timestampError) { return handleError(timestampError) }
  }

  async function acceptCharacter () {
    const { error } = await supabase.from('characters').update({ accepted: true, open: false }).eq('id', character.id)
    if (error) { return handleError(error) }
    await charactersChanged()

    // add bookmark to the new player
    const { error: bookmarkError } = await supabase.from('bookmarks').upsert({ user_id: character.player.id, game_id: game.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
    if (bookmarkError) { return handleError(bookmarkError) }

    // send welcome message to the new player
    const { error: messageError } = await supabase.from('messages').insert({ content: game.welcome_message, sender_user: user.id, recipient_user: character.player.id })
    if (messageError) { return handleError(messageError) }

    window.location.href = window.location.href + '/?toastType=success&toastText=' + encodeURIComponent('Postava byla přijata')
  }

  async function rejectCharacter (own = false) {
    if (!window.confirm(own ? 'Opravdu zrušit přihlášení?' : 'Opravdu odmítnout postavu?')) { return }
    const { error } = await supabase.from('characters').update({ game: null, accepted: false }).eq('id', character.id)
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent(own ? 'Přihláška byla zrušena' : 'Postava byla vyřazena ze hry')
  }

  async function kickCharacter () {
    if (!window.confirm('Opravdu vyhodit postavu? Její příspěvky zůstanou.')) { return }
    // update the original character to remove the player
    const { error } = await supabase.from('characters').update({ player: null, game: null }).eq('id', character.id)
    if (error) { return handleError(error) }
    // create a new character with the same data for the player to keep
    delete character.id
    delete character.player
    const newChar = { ...character, game: null, player: user.id }
    const { error: newCharacterError } = await supabase.from('characters').insert(newChar)
    if (newCharacterError) { return handleError(newCharacterError) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent('Postava byla vyřazena ze hry')
  }

  async function freeCharacter () {
    if (!window.confirm('Opravdu dát na seznam volných postav? (bude předána jinému hráči)')) { return }
    const { error } = await supabase.from('characters').update({ open: true }).eq('id', character.id)
    await charactersChanged()
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent('Postava byla uvolněna')
  }

  async function claimCharacter () {
    if (!window.confirm('Opravdu převzít postavu?')) { return }
    const { error } = await supabase.from('characters').update({ open: false, player: user.id }).eq('id', character.id)
    await charactersChanged()
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent('Postava byla převzata')
  }
</script>

<tr class='char'>
  <td class='portrait'>
    {#if character.portrait}
      {#await getPortrait(character.id, character.portrait) then url}<img src={url} class='portrait' alt='portrét postavy' />{/await}
    {/if}
  </td>
  <td class='name'>
    {#if character.storyteller}
      <span use:tooltip class='material star' title='Vypravěč'>star</span>
    {/if}
    {#if isPlayer || isStoryteller}
      <a href={`${window.location.origin}/game/character?id=${character.id}`} class='character'>{character.name}</a>
    {:else}
      {character.name}
    {/if}
  </td>
  {#if isStoryteller}
    <td class='player'><a href={'/user?id=' + character.player.id} class='user'>{character.player.name}</a></td>
  {/if}
  <td>
    {#if isStoryteller || !character.accepted || character.open}
      <div class='options'>
        {#if character.open}
          <button on:click={() => claimCharacter()} class='square'>převzít</button>
        {/if}
        {#if isPlayer && !character.accepted && !isStoryteller}
          <button on:click={() => rejectCharacter(true)} class='square'>zrušit</button>
        {/if}
        {#if isStoryteller}
          {#if character.accepted}
            {#if !character.open}
              <button on:click={() => freeCharacter()} class='square'>uvolnit</button>
            {/if}
            <button on:click={() => kickCharacter()} class='square'>vyloučit</button>
          {:else}
            <button on:click={() => acceptCharacter()} class='square'>přijmout</button>
            <button on:click={() => rejectCharacter()} class='square'>odmítnout</button>
          {/if}
        {/if}
      </div>
    {/if}
  </td>
</tr>

<style>
  .char {
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
    .player {
      margin-right: 20px;
      font-weight: bold;
    }
</style>