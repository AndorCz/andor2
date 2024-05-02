<script>
  import { tooltip } from '@lib/tooltip'
  import { redirectWithToast } from '@lib/utils'
  import { supabase, handleError, getPortraitUrl } from '@lib/database'

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

    // add bookmark to the new player
    const { error: bookmarkError } = await supabase.from('bookmarks').upsert({ user_id: character.player.id, game_id: game.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
    if (bookmarkError) { return handleError(bookmarkError) }

    // send welcome message to the new player
    const { error: messageError } = await supabase.from('messages').insert({ content: game.welcome_message, sender_user: user.id, recipient_user: character.player.id })
    if (messageError) { return handleError(messageError) }

    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla přijata' })
  }

  async function rejectCharacter (own = false) {
    if (!window.confirm(own ? 'Opravdu zrušit přihlášení?' : 'Opravdu odmítnout postavu?')) { return }
    const { error } = await supabase.from('characters').update({ game: null, accepted: false }).eq('id', character.id)
    if (error) { return handleError(error) }
    redirectWithToast({ toastType: 'success', toastText: own ? 'Přihláška byla zrušena' : 'Postava byla odmítnuta' })
  }

  async function kickOwnCharacter () {
    if (!window.confirm('Opravdu zabít postavu? Vytvoří se kopie a postava se přesune na hřbitov')) { return }
    await supabase.from('characters').update({ state: 'dead' }).eq('id', character.id)
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla přesunuta na hřbitov' })
  }
  
  async function kickCharacter () {
    if (character.player.id == user.id) {
      if (!window.confirm('Opravdu zabít postavu? Vytvoří se kopie a postava se přesune na hřbitov')) { return }
    }
    else {
      if (!window.confirm('Opravdu zabít postavu? Hráč bude vyřazen, vytvoří se mu kopie a postava se přesune na hřbitov')) { return }
      const { data, error } = await supabase.rpc('take_over_character', { character_id: character.id })
      if (data && !error) {
        // copy portrait
        await supabase.storage.from('portraits').copy(`${character.id}.jpg`, `${data}.jpg`)
      }
    }
    // update the original character to remove the player

    if (error) { return handleError(error) }
    // set character to dead
    await supabase.from('characters').update({ state: 'dead' }).eq('id', character.id)
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla přesunuta na hřbitov' })
  }

  async function takeOverCharacter () {
    if (!window.confirm('Opravdu násilně převzít postavu? Hráč bude vyřazen a vytvoří se mu kopie.')) { return }
    // update the original character to remove the player and create copy for original player
    const { data, error } = await supabase.rpc('take_over_character', { character_id: character.id })
    if (data && !error) {
      // copy portrait
      await supabase.storage.from('portraits').copy(`${character.id}.jpg`, `${data}.jpg`)
    }
    if (error) { return handleError(error) }
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla převzata' })
  }

  async function freeCharacter () {
    if (!window.confirm('Opravdu dát na seznam volných postav? (bude nabídnuta všem)')) { return }
    const { error } = await supabase.from('characters').update({ open: true }).eq('id', character.id)
    if (error) { return handleError(error) }
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla uvolněna' })
  }

  async function claimCharacter () {
    if (!window.confirm('Opravdu převzít postavu?')) { return }
    const { error } = await supabase.rpc('claim_character', { character_id: character.id })
    if (error) { return handleError(error) }
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla převzata' })
  }

  async function leaveGame () {
    if (!window.confirm('Opravdu odejít z hry? Postava zůstane a vytvoří se kopie')) { return }
    const { data, error } = await supabase.rpc('hand_over_character', { character_id: character.id, new_owner: game.owner.id })
    if (data && !error) {
      // copy portrait
      await supabase.storage.from('portraits').copy(`${character.id}.jpg`, `${data}.jpg`)
    }
    if (error) { return handleError(error) }
    
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla předána' })
  }
</script>

<tr class='char'>
  <td class='portrait'>
    {#if character.portrait}
      <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt='portrét postavy' />
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
  {#if isPlayer && character.accepted && !isStoryteller }
    <td>
      <div class='options'>
        <button on:click={() => leaveGame()}>odejít</button>
      </div>
    </td>
  {/if}
  <td>
    {#if user.id && (isStoryteller || !character.accepted || character.open) && !game.archived}
      <div class='options'>
        {#if character.open}
          <button on:click={() => claimCharacter()}>vzít</button>
        {/if}
        {#if isPlayer && !character.accepted && !isStoryteller}
          <button on:click={() => rejectCharacter(true)}>zrušit</button>
        {/if}
        {#if isStoryteller}
          {#if character.accepted}
            {#if !character.open && character.player.id == user.id}
              <button on:click={() => freeCharacter()}>nabídnout</button>
            {/if}
          {#if character.player.id != user.id}
            <button on:click={() => takeOverCharacter()}>převzít</button>
          {/if}
            <button on:click={() => kickCharacter()}>zabít</button>
          {:else}
            <button on:click={() => acceptCharacter()}>přijmout</button>
            <button on:click={() => rejectCharacter()}>odmítnout</button>
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
    button {
      padding: 10px;
    }
</style>
