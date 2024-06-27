<script>
  import { onMount } from 'svelte'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database-browser'
  import { isFilledArray, redirectWithToast } from '@lib/utils'
  import EditableLong from '@components/common/EditableLong.svelte'
  import Character from '@components/games/characters/Character.svelte'
  import CharacterHeader from '@components/games/characters/CharacterHeader.svelte'

  export let game = {}
  export let user = {}
  export let isStoryteller

  const characters = { waiting: [], open: [], myOpen: [] }
  const isCharPlayer = (char) => { return char.player?.id === user.id }
  let myOpenSelected = ''

  game.characters.forEach((char) => {
    if (char.state === 'alive') {
      if (char.open) { // open
        characters.open.push(char)
      } else if (char.player && !char.accepted) { // waiting
        if (isStoryteller) { // show all waiting to storytellers
          characters.waiting.push(char)
        } else if (isCharPlayer(char)) { // show only own characters
          characters.waiting.push(char)
        }
      }
    }
  })

  // sort characters by name
  characters.waiting.sort((a, b) => a.name.localeCompare(b.name))
  characters.open.sort((a, b) => a.name.localeCompare(b.name))
  characters.myOpen.sort((a, b) => a.name.localeCompare(b.name))

  onMount(async () => {
    if (user.id) {
      const { data: myOpen, error: error2 } = await supabase.from('characters')
        .select('id, name, player:profiles(id, name), portrait, open, storyteller, state, accepted')
        .eq('player', user.id).eq('state', 'alive').is('game', null)
      if (error2) { return handleError(error2) }
      characters.myOpen = myOpen
    }
  })

  async function updateRecruitment () {
    const newData = { recruitment: game.recruitment, characters_changed_at: new Date() }
    const { error } = await supabase.from('games').update(newData).eq('id', game.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }

  /*
  async function charactersChanged (event) {
    const { error: timestampError } = await supabase.from('games').update({ characters_changed_at: new Date() }).eq('id', game.id)
    if (timestampError) { return handleError(timestampError) }
  }
  */

  async function signExisting () {
    const { error } = await supabase.from('characters').update({ game: game.id, accepted: false, storyteller: false }).eq('id', myOpenSelected)
    if (user.id !== game.owner.id) {
      await supabase.from('messages').insert({ content: `Hlásím se do tvé hry ${game.name}`, sender_user: user.id, recipient_user: game.owner.id })
    }
    if (error) { return handleError(error) }
    // await charactersChanged()
    redirectWithToast({ toastType: 'success', toastText: 'Postava byla přihlášena do hry' })
  }
</script>

<EditableLong placeholder='Informace o náboru nových hráčů, četnosti hraní a tvorbě postav.'{user} bind:value={game.recruitment} onSave={updateRecruitment} canEdit={isStoryteller} enterSend={false} allowHtml />
<br>

{#if game.archived}
  <div class='info'><span class='material'>info</span>Hra je archivovaná</div>
{:else}
  {#if isStoryteller || isFilledArray(characters.waiting)}
    <h2>Hlásí se</h2>
    <table class='characters'>
      {#if isFilledArray(characters.waiting)}
        <CharacterHeader {isStoryteller} />
        {#each characters.waiting as character}
          <Character {user} {character} {isStoryteller} {game} />
        {/each}
      {:else}
        <tr><td class='none'>Žádné postavy</td></tr>
      {/if}
    </table>
  {/if}

  {#if game.recruitment_open}
    <h2>Volné postavy k převzetí</h2>
    <table class='characters'>
      {#if isFilledArray(characters.open)}
        <CharacterHeader {isStoryteller} />
        {#each characters.open as character}
          <Character {user} {character} {isStoryteller} {game} />
        {/each}
      {:else}
        <tr><td class='none'>Žádné postavy</td></tr>
      {/if}
    </table>

    {#if user.id}
      <h2>Přihlásit se</h2>
      <div class='row'>
        <div class='existing' class:empty={characters.myOpen.length === 0}>
          <select bind:value={myOpenSelected}>
            <option value=''>Vyberte postavu bez hry</option>
            {#each characters.myOpen as character}
              <option value={character.id}>{character.name}</option>
            {/each}
          </select>
          <button on:click={signExisting} class='large' disabled={myOpenSelected === ''}>Přihlásit existující postavu</button>
        </div>
        <a href={window.location.origin + '/game/character-form?game=' + game.id} class='button large'>Vytvořit novou postavu</a>
      </div>
    {/if}
  {:else}
    <div class='info'><span class='material'>info</span>Nábor je uzavřený</div>
  {/if}
{/if}

<style>
  h2 {
    margin-top: 0px;
  }
  .characters {
    width: 100%;
    margin-bottom: 50px;
  }
  .none {
    padding-left: 20px;
    color: var(--dim);
  }
  .info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    margin-top: 20px;
    gap: 40px;
  }
  .existing {
    flex: 1;
    display: flex;
    gap: 10px;
  }
    .existing select {
      flex: 1;
      min-width: 300px;
      flex-wrap: wrap;
    }
    .empty {
      opacity: 0.5;
    }
  @media (max-width: 500px) {
    .existing {
      flex-direction: column;
    }
    .existing select {
      width: 100%;
    }
  }
</style>
