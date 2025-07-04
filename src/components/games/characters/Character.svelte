<script>
  import { run } from 'svelte/legacy'

  import { tooltip } from '@lib/tooltip'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { showError } from '@lib/toasts'
  import { clickOutside } from '@lib/clickOutside'
  import { redirectWithToast } from '@lib/utils'
  import { supabase, handleError, getPortraitUrl, userAutocomplete } from '@lib/database-browser'
  import Select from 'svelte-select'

  let { user, game, character, isStoryteller, actionsVisible = $bindable(false) } = $props()

  let actionsAvailable = $state(false)
  let newOwner = $state()
  let showTransfer = $state(false)

  // buttons
  let showLeaveButton = $state(false)
  let showClaimButton = $state(false)
  let showRejectButton = $state(false)
  let showFreeButton = $state(false)
  let showTakeOverButton = $state(false)
  let showTransferButton = $state(false)
  let showCancelTransferButton = $state(false)
  let showKillButton = $state(false)
  let showAcceptButton = $state(false)
  let showRejectStorytellerButton = $state(false)
  let showReviveButton = $state(false)
  let showDeleteButton = $state(false)

  const isPlayer = character.player.id === user.id

  async function charactersChanged (event) {
    const { error: timestampError } = await supabase.from('games').update({ characters_changed_at: new Date() }).eq('id', game.id)
    if (timestampError) { return handleError(timestampError) }
  }

  async function acceptCharacter () {
    const { error } = await supabase.from('characters').update({ accepted: true, open: false, storyteller: false }).eq('id', character.id)
    if (error) { return handleError(error) }

    // add bookmark to the new player
    const { error: bookmarkError } = await supabase.from('bookmarks').upsert({ user_id: character.player.id, game_id: game.id, game_main_thread: game.game_thread, game_discussion_thread: game.discussion_thread }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
    if (bookmarkError) { return handleError(bookmarkError) }

    // send welcome message to the new player
    if (user.id !== character.player.id) {
      const { error: messageError } = await supabase.from('messages').insert({ content: game.welcome_message, sender_user: user.id, recipient_user: character.player.id })
      if (messageError) { return handleError(messageError) }
    }

    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla přijata' })
  }

  async function copyCharacterPortrait (fromId, toId) {
    const { error: copyError } = await supabase.storage.from('portraits').copy(`${fromId}.jpg`, `${toId}.jpg`)
    if (!copyError) { return true } else { showError(copyError.message) }
    return false
  }

  async function rejectCharacter (own = false) {
    if (window.confirm(own ? 'Opravdu zrušit přihlášení?' : 'Opravdu odmítnout postavu?')) {
      const { error } = await supabase.rpc('reject_character', { character_id: character.id })
      if (user.id !== character.player.id) {
        const { error: messageError } = await supabase.from('messages').insert({ content: 'Tvoje přihláška do mé hry byla odmítnuta.', sender_user: user.id, recipient_user: character.player.id })
        if (messageError) { return handleError(messageError) }
      }
      if (error) { return handleError(error) }
      redirectWithToast({ toastType: 'success', toastText: own ? 'Přihláška byla zrušena' : 'Postava byla odmítnuta' })
    }
  }

  async function killCharacter () {
    const previousOwner = character.player.id
    if (character.player.id === user.id) {
      if (!window.confirm('Opravdu zabít postavu? Postava se přesune na hřbitov')) { return }
    } else {
      if (window.confirm('Opravdu zabít postavu? Hráč bude vyřazen, vytvoří se mu kopie a postava se přesune na hřbitov')) {
        const { data, error } = await supabase.rpc('take_over_character', { character_id: character.id })
        if (data && !error) { // copy portrait
          await copyCharacterPortrait(character.id, data)
        }
      }
    }
    // set character to dead
    const { error: deadError } = await supabase.from('characters').update({ state: 'dead' }).eq('id', character.id)
    if (deadError) { return handleError(deadError) }
    await charactersChanged()

    if (user.id !== previousOwner) {
      const { error: insertError } = await supabase.from('messages').insert({ content: `Převzal/a jsem tvoji postavu ${character.name}`, sender_user: user.id, recipient_user: previousOwner })
      if (insertError) { return handleError(insertError) }
    }
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla přesunuta na hřbitov' })
  }

  async function takeOverCharacter () {
    if (window.confirm('Opravdu násilně převzít postavu? Hráč bude vyřazen a vytvoří se mu kopie.')) {
      // update the original character to remove the player and create copy for original player
      const previousOwner = character.player.id
      const { data, error } = await supabase.rpc('take_over_character', { character_id: character.id })
      if (data && !error) {
        // copy portrait
        await copyCharacterPortrait(character.id, data)
      }
      if (error) { return handleError(error) }
      await charactersChanged()
      // Send message to player
      if (user.id !== previousOwner) {
        const { error: insertError } = await supabase.from('messages').insert({ content: `Převzal/a jsem tvoji postavu ${character.name}`, sender_user: user.id, recipient_user: previousOwner })
        if (insertError) { return handleError(insertError) }
      }
      redirectWithToast({ toastType: 'success', toastText: 'Postava byla převzata' })
    }
  }

  async function transferCharacter () {
    if (window.confirm('Opravdu chceš převést postavu?')) {
      const { data: found, error } = await supabase.rpc('check_if_transferable', { character_id: character.id }).single()
      if (error) { return handleError(error) }
      if (!found) { return handleError('Postava nenalezena, nebo se převádí na jiného uživatele.') }
      const { error: updateError } = await supabase.from('characters').update({ open: true, transfer_to: newOwner.id }).eq('id', character.id)
      if (updateError) { return handleError(updateError) }

      if (user.id !== newOwner.id) {
        const { error: insertError } = await supabase.from('messages').insert({
          content: `Nabízím ti postavu ${character.name} ve hře ${game.name}.<br><a href='/api/game/acceptCharacter?gameId=${game.id}&characterId=${character.id}' class='button' rel='noreferrer noopener'>Přijmout postavu</a> <a href='/api/game/rejectCharacter?gameId=${game.id}&characterId=${character.id}' class='button' rel='noreferrer noopener'>Odmítnout</a>`,
          sender_user: user.id,
          recipient_user: newOwner.id
        })
        if (insertError) { return handleError(insertError) }
      }
      await charactersChanged()
      redirectWithToast({ toastType: 'success', toastText: `Postava byla nabídnuta hráči ${newOwner.name}` })
    }
  }

  async function cancelTransfer () {
    if (window.confirm('Opravdu chceš zrušit převod?')) {
      const oldOwner = character.transfer_to
      const { error } = await supabase.from('characters').update({ open: false, transfer_to: null }).eq('id', character.id)
      if (error) { return handleError(error) }
      if (user.id !== oldOwner) {
        // update message
        const { error: messageUpdateError } = await supabase.rpc('update_transfer_message', { character_id: character.id, game_id: game.id, new_content: '<br>Nabídka byla zrušena' })
        if (messageUpdateError) { return handleError(messageUpdateError) }
      }
      await charactersChanged()
      redirectWithToast({ toastType: 'success', toastText: 'Nabídka postavy zrušena' })
    }
  }

  async function claimCharacter () {
    if (window.confirm('Opravdu převzít postavu?')) {
      const { error } = await supabase.rpc('claim_character', { character_id: character.id })
      if (error) { return handleError(error) }

      const { error: upsertError } = await supabase.from('bookmarks').upsert({ user_id: user.id, game_id: game.id, game_main_thread: game.game_thread, game_discussion_thread: game.discussion_thread }, { onConflict: 'user_id, game_id', ignoreDuplicates: true })
      if (upsertError) { return handleError(upsertError) }

      if (user.id !== game.owner.id) {
        const { error: insertError } = await supabase.from('messages').insert({ content: `Převzal/a jsem postavu ${character.name} v tvojí hře ${game.name}`, sender_user: user.id, recipient_user: game.owner.id })
        if (insertError) { return handleError(insertError) }
      }
      await charactersChanged()

      redirectWithToast({ toastType: 'success', toastText: 'Postava byla převzata' })
    }
  }

  async function freeCharacter () {
    if (window.confirm('Opravdu dát na seznam volných postav? (Bude nabídnuta všem)')) {
      const { error } = await supabase.from('characters').update({ open: true }).eq('id', character.id)
      if (error) { return handleError(error) }
      await charactersChanged()
      redirectWithToast({ toastType: 'success', toastText: 'Postava byla uvolněna' })
    }
  }

  async function leaveGame () {
    if (window.confirm('Opravdu odejít z hry? Postava zůstane a vytvoří se kopie')) {
      const { data, error } = await supabase.rpc('hand_over_character', { character_id: character.id, new_owner: game.owner.id })
      if (error) { return handleError(error) }
      if (data && !error) {
        // copy portrait
        await copyCharacterPortrait(character.id, data)
        if (user.id !== game.owner.id) {
          const { error: insertError } = await supabase.from('messages').insert({ content: `Opustil/a jsem tvou hru ${game.name}. Postava ${character.name} tam zůstává.`, sender_user: user.id, recipient_user: game.owner.id })
          if (insertError) { return handleError(insertError) }
        }
        await charactersChanged()
        redirectWithToast({ toastType: 'success', toastText: 'Postava byla předána' })
      }
    }
  }

  async function reviveCharacter () {
    const { error } = await supabase.from('characters').update({ state: 'alive' }).eq('id', character.id)
    if (error) { return handleError(error) }
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla oživena' })
  }

  async function deleteCharacter () {
    const { error } = await supabase.from('characters').update({ state: 'deleted' }).eq('id', character.id)
    if (error) { return handleError(error) }
    await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava smazána' })
  }

  function handleClickOutside (event) {
    actionsVisible = false
    showTransfer = false
  }

  async function loadUsers (name) {
    if (name.length < 3) { return [] }
    return await userAutocomplete(name)
  }

  run(() => { showLeaveButton = character.state === 'alive' && isPlayer && character.accepted && !isStoryteller })
  run(() => { showClaimButton = character.state === 'alive' && user.id && (isStoryteller || !character.accepted || character.open) && !game.archived && character.open && character.player.id !== user.id && !character.transfer_to })
  run(() => { showRejectButton = character.state === 'alive' && isPlayer && !character.accepted && !isStoryteller })
  run(() => { showFreeButton = character.state === 'alive' && isStoryteller && character.accepted && !character.open && character.player.id === user.id })
  run(() => { showTakeOverButton = character.state === 'alive' && isStoryteller && character.accepted && !character.open && character.player.id !== user.id })
  run(() => { showTransferButton = character.state === 'alive' && isStoryteller && character.accepted && character.player.id === user.id && !character.transfer_to })
  run(() => { showCancelTransferButton = character.state === 'alive' && isStoryteller && character.accepted && character.transfer_to })
  run(() => { showKillButton = character.state === 'alive' && isStoryteller && character.accepted && !character.transfer_to })
  run(() => { showAcceptButton = character.state === 'alive' && isStoryteller && !character.accepted })
  run(() => { showRejectStorytellerButton = character.state === 'alive' && isStoryteller && !character.accepted })
  run(() => { showReviveButton = character.state === 'dead' && isStoryteller })
  run(() => { showDeleteButton = character.state === 'dead' && isStoryteller })
  run(() => {
    actionsAvailable = showLeaveButton || showClaimButton || showRejectButton || showFreeButton || showTakeOverButton || showTransferButton || showCancelTransferButton || showKillButton || showAcceptButton || showRejectStorytellerButton || showReviveButton || showDeleteButton
  })
</script>

<tr class='char'>
  <td class='portrait'>
    {#if character.portrait}
      <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt='portrét postavy' />
    {:else}
      <img src='/default_char.jpg' class='portrait empty' alt='portrét postavy' />
    {/if}
  </td>
  <td class='name' style={`--nameColor: ${character.color || '#968ebd'}`}>
    <a href={`${window.location.origin}/game/character?id=${character.id}`} class='full character'>
      {#if character.storyteller}<span use:tooltip class='material star' title='Vypravěč'>star</span>{/if}
      {character.name}
    </a>
  </td>
  {#if isStoryteller}
    <td class='player'><a href={'/user?id=' + character.player.id} class='user'>{character.player.name}</a></td>
  {/if}
  <td class='options' use:clickOutside onclick_outside={handleClickOutside}>
    {#if actionsAvailable}
      <div class='actions' class:visible={actionsVisible}>
        <!-- active player options -->
        {#if showLeaveButton}
          <button onclick={leaveGame}>odejít</button>
        {/if}
        {#if showClaimButton}
          <button onclick={claimCharacter} title='Tuto postavu si můžete volně vzít' use:tooltip>vzít</button>
        {/if}
        {#if showRejectButton}
          <button onclick={() => rejectCharacter(true)} title='Zrušit svou přihlášku' use:tooltip>zrušit</button>
        {/if}
        {#if showFreeButton}
          <button onclick={freeCharacter} title='Dát postavu na seznam k volnému převzetí' use:tooltip>nabídnout</button>
        {/if}
        {#if showTakeOverButton}
          <button onclick={takeOverCharacter} title='Vzít postavu hráči, nechá mu kopii' use:tooltip>převzít</button>
        {/if}
        {#if showTransferButton}
          <button onclick={() => { showTransfer = !showTransfer }} class:active={showTransfer} class='material square' title='Převést postavu na konkrétního hráče' use:tooltip>transfer_within_a_station</button>
        {/if}
        {#if showCancelTransferButton}
          <button onclick={cancelTransfer}>zrušit převod</button>
        {/if}
        {#if showKillButton}
          <button onclick={killCharacter} class='material square' title='Zabít postavu' use:tooltip>skull</button>
        {/if}
        {#if showAcceptButton}
          <button onclick={acceptCharacter}>přijmout</button>
        {/if}
        {#if showRejectStorytellerButton}
          <button onclick={rejectCharacter}>odmítnout</button>
        {/if}
        {#if showReviveButton}
          <button onclick={reviveCharacter}>oživit</button>
        {/if}
        {#if showDeleteButton}
          <button onclick={deleteCharacter}>smazat</button>
        {/if}
      </div>
      {#if $platform === 'mobile'}
        <button onclick={() => { actionsVisible = !actionsVisible }} class='material square' class:active={actionsVisible} title='Možnosti' use:tooltip>settings</button>
      {/if}
    {/if}
    <div class='transferModal' class:visible={showTransfer}>
      <div class='transferText'>Vyber hráče, na kterého chceš postavu převést:</div>
      <div class='row'>
        <Select bind:value={newOwner} loadOptions={loadUsers} label='name' placeholder='Jméno uživatele'>
          {#snippet empty()}
                    <div >Uživatel nenalezen</div>
                  {/snippet}
        </Select>
        <button onclick={transferCharacter} class='material square'>check</button>
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
      min-width: 100px;
    }
      .name .full {
        color: var(--nameColor);
        padding: 15px;
        display: block;
        height: 100%;
        font-size: 22px;
      }
        .name .star {
          font-size: 17px;
          margin-right: 5px;
        }
        .name a.full:hover {
          color: var(--linkHover);
          background-color: var(--block);
        }
    .player {
      padding: 15px;
      min-width: 100px;
    }

    .options {
      position: relative;
      padding: 10px;
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
