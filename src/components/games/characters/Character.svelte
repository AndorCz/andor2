<script>
  import { tooltip } from '@lib/tooltip'
  import { clickOutside } from '@lib/clickOutside'
  import { redirectWithToast } from '@lib/utils'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { supabase, handleError, getPortraitUrl, userAutocomplete } from '@lib/database'
  import Select from 'svelte-select'

  export let user
  export let game
  export let character
  export let isStoryteller
  export let actionsVisible = false

  let newOwner
  let showTransfer = false
  const isPlayer = character.player.id === user.id

  async function charactersChanged (event) {
    const { error: timestampError } = await supabase.from('games').update({ characters_changed_at: new Date() }).eq('id', game.id)
    if (timestampError) { return handleError(timestampError) }
  }

  async function acceptCharacter () {
    const { error } = await supabase.from('characters').update({ accepted: true, open: false, storyteller: false }).eq('id', character.id)
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
    const { error } = await supabase.rpc('reject_character', { character_id: character.id })
    if (error) { return handleError(error) }
    redirectWithToast({ toastType: 'success', toastText: own ? 'Přihláška byla zrušena' : 'Postava byla odmítnuta' })
  }

  async function killCharacter () {
    const previousOwner = character.player.id
    if (character.player.id === user.id) {
      if (!window.confirm('Opravdu zabít postavu? Postava se přesune na hřbitov')) { return }
    } else {
      if (!window.confirm('Opravdu zabít postavu? Hráč bude vyřazen, vytvoří se mu kopie a postava se přesune na hřbitov')) { return }
      const { data, error } = await supabase.rpc('take_over_character', { character_id: character.id })
      if (data && !error) { // copy portrait
        const { error: copyError } = await supabase.storage.from('portraits').copy(`${character.id}.jpg`, `${data}.jpg`)
        if (copyError) { return handleError(copyError) }
      }
    }
    // set character to dead
    await supabase.from('characters').update({ state: 'dead' }).eq('id', character.id)
    await charactersChanged()
    await supabase.from('messages').insert({ content: `Převzal/a jsem tvojí postavu ${character.name}`, sender_user: user.id, recipient_user: previousOwner })
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla přesunuta na hřbitov' })
  }

  async function takeOverCharacter () {
    if (!window.confirm('Opravdu násilně převzít postavu? Hráč bude vyřazen a vytvoří se mu kopie.')) { return }
    // update the original character to remove the player and create copy for original player
    const previousOwner = character.player.id
    const { data, error } = await supabase.rpc('take_over_character', { character_id: character.id })
    if (data && !error) { // copy portrait
      const { error: copyError } = await supabase.storage.from('portraits').copy(`${character.id}.jpg`, `${data}.jpg`)
      if (copyError) { return handleError(copyError) }
    }
    if (error) { return handleError(error) }
    await charactersChanged()
    // Send message to player
    await supabase.from('messages').insert({ content: `Převzal/a jsem tvojí postavu ${character.name}`, sender_user: user.id, recipient_user: previousOwner })
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla převzata' })
  }

  async function transferCharacter (transferTo) {
    if (!window.confirm('Opravdu chceš převést postavu?')) { return }
    const { error } = await supabase.from('characters').update({ open: true, transfer_to: transferTo }).eq('id', character.id)
    await supabase.from('messages').insert({ content: `Nabízím ti postavu ${character.name} ve hře ${game.name}`, sender_user: user.id, recipient_user: transferTo })
    if (error) { return handleError(error) }
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: `Postava byla nabídnuta hráči ${transferTo}` })
  }

  async function claimCharacter () {
    if (!window.confirm('Opravdu převzít postavu?')) { return }
    const { error } = await supabase.rpc('claim_character', { character_id: character.id })
    if (error) { return handleError(error) }
    if (!error) {
      await supabase.from('bookmarks').upsert({ user_id: user.id, game_id: game.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
      await supabase.from('messages').insert({ content: `Převzal/a jsem postavu ${character.name} v tvojí hře ${game.name}`, sender_user: user.id, recipient_user: game.owner.id })
      await charactersChanged()
      redirectWithToast({ toastType: 'success', toastText: 'Postava byla převzata' })
    }
  }

  async function freeCharacter () {
    if (!window.confirm('Opravdu dát na seznam volných postav? (Bude nabídnuta všem)')) { return }
    const { error } = await supabase.from('characters').update({ open: true }).eq('id', character.id)
    if (error) { return handleError(error) }
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla uvolněna' })
  }

  async function leaveGame () {
    if (!window.confirm('Opravdu odejít z hry? Postava zůstane a vytvoří se kopie')) { return }
    const { data, error } = await supabase.rpc('hand_over_character', { character_id: character.id, new_owner: game.owner.id })
    if (data && !error) { // copy portrait
      const { error: copyError } = await supabase.storage.from('portraits').copy(`${character.id}.jpg`, `${data}.jpg`)
      if (copyError) { return handleError(copyError) }
    }
    await supabase.from('messages').insert({ content: `Opustil/a jsem tvou hru ${game.name}. Postava ${character.name} tam zůstává.`, sender_user: user.id, recipient_user: game.owner.id })
    if (error) { return handleError(error) }

    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla předána' })
  }

  async function reviveCharacter () {
    await supabase.from('characters').update({ state: 'alive' }).eq('id', character.id)
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla oživena' })
  }

  async function deleteCharacter () {
    await supabase.from('characters').update({ state: 'deleted' }).eq('id', character.id)
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava smazána' })
  }

  function handleClickOutside (event) {
    actionsVisible = false
    showTransfer = false
  }

  async function loadUsers (name) {
    if (name.length < 3) { return [] }
    const results = await userAutocomplete(name)
    return results
  }
</script>

<tr class='char'>
  <td class='portrait'>
    {#if character.portrait}
      <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt='portrét postavy' />
    {:else}
      <img src='/default_char.jpg' class='portrait empty' alt='portrét postavy' />
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
  <td class='options' use:clickOutside on:click_outside={handleClickOutside}>
    {#if character.state === 'alive'}
      <!-- active player options -->
      {#if isPlayer && character.accepted && !isStoryteller }
        <button on:click={() => leaveGame()}>odejít</button>
      {/if}

      {#if user.id && (isStoryteller || !character.accepted || character.open) && !game.archived}
        <div class='actions' class:visible={actionsVisible}>
          <!-- recruitment actions -->
          {#if character.open && character.player.id !== user.id} <!--  && (!character.transfer_to || character.transfer_to === user.id) -->
            <button on:click={() => claimCharacter()} title='Tuto postavu si můžete volně vzít' use:tooltip>vzít</button>
          {/if}
          {#if isPlayer && !character.accepted && !isStoryteller}
            <button on:click={() => rejectCharacter(true)} title='Zrušit svou přihlášku' use:tooltip>zrušit</button>
          {/if}
          <!-- storyteller actions -->
          {#if isStoryteller}
            {#if character.accepted}
              {#if !character.open && character.player.id === user.id}
                <button on:click={() => freeCharacter()} title='Dát postavu na seznam k volnému převzetí' use:tooltip>nabídnout</button>
              {/if}
              {#if !character.open && character.player.id !== user.id}
                <button on:click={() => takeOverCharacter()} title='Vzít postavu hráči, nechá mu kopii' use:tooltip>převzít</button>
              {/if}
              <button on:click={() => { showTransfer = !showTransfer }} class:active={showTransfer} class='material square' title='Převést postavu na konkrétního hráče' use:tooltip>transfer_within_a_station</button>
              <button on:click={() => killCharacter()} class='material square' title='Zabít postavu' use:tooltip>skull</button>
            {:else}
              <button on:click={() => acceptCharacter()}>přijmout</button>
              <button on:click={() => rejectCharacter()}>odmítnout</button>
            {/if}
          {/if}
        </div>
        {#if $platform === 'mobile'}
          <button on:click={() => { actionsVisible = !actionsVisible }} class='material square' class:active={actionsVisible} title='Možnosti' use:tooltip>settings</button>
        {/if}
      {/if}
    {:else if character.state === 'dead'}
      <!-- graveyard -->
      <button on:click={() => reviveCharacter()}>oživit</button>
      <button on:click={() => deleteCharacter()}>smazat</button>
    {/if}

    <div class='transferModal' class:visible={showTransfer}>
      <div class='transferText'>Vyber hráče, na kterého chceš postavu převést:</div>
      <div class='row'>
        <Select bind:value={newOwner} loadOptions={loadUsers} label='name' placeholder='Jméno uživatele'>
          <div slot='empty'>Uživatel nenalezen</div>
        </Select>
        <button on:click={() => transferCharacter()} class='material square'>check</button>
      </div>
    </div>
  </td>
</tr>

<style>
  .row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
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
      max-height: 80px;
      object-fit: cover;
      object-position: center 20%;
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
      position: relative;
    }
      .actions {
        display: flex;
        gap: 10px;
        height: 100%;
        padding: 0px 5px;
        justify-content: flex-end;
      }
    .player {
      margin-right: 20px;
      font-weight: bold;
    }
    button {
      padding: 10px;
    }
    .transferModal {
      display: none;
      position: absolute;
      top: 0px;
      right: 0px;
      background-color: var(--block);
      z-index: 100;
      border-radius: 10px;
      box-shadow: 1px 1px 8px #0008;
      padding: 20px;
      width: 300px;
    }
      .transferModal.visible {
        display: block;
      }
      .transferText {
        margin-bottom: 10px;
      }

  @media (max-width: 860px) {
    .actions {
      display: none;
      position: absolute;
      top: 0px;
      right: 60px;
      padding: 15px;
      border-radius: 10px;
      background-color: var(--panel);
      box-shadow: 3px 3px 6px #0003;
    }
      .actions.visible {
        display: flex;
        height: 80px;
      }
        .actions.visible button {
          height: 100%;
        }
  }
</style>
