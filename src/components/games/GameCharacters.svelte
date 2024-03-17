<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, setRead } from '@lib/database'
  import { isFilledArray } from '@lib/utils'
  import { showSuccess } from '@lib/toasts'
  import Character from '@components/games/Character.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'
  import CharacterHeader from '@components/games/CharacterHeader.svelte'

  export let user = {}
  export let data = {}
  export let isGameOwner
  export let isStoryteller

  // sort character categories
  const isCharPlayer = (char) => { return char.player?.id === user.id }
  const characters = { playing: [], waiting: [], open: [], storytellers: [], myOpen: [] }
  let myOpenSelected = ''

  data.characters.forEach((char) => {
    if (char.storyteller) { // storytellers
      characters.storytellers.push(char)
    } else if (char.open) { // open
      characters.open.push(char)
    } else if (char.player) {
      if (char.accepted) { // playing
        characters.playing.push(char)
      } else { // waiting
        if (isGameOwner) { // all waiting to owner
          characters.waiting.push(char)
        } else if (isCharPlayer(char)) { // only their to player
          characters.waiting.push(char)
        }
      }
    }
  })

  onMount(async () => {
    if (user.id) {
      delete data.unread.gameCharacters
      setRead(user.id, 'game-characters-' + data.id)

      const { data: myOpen, error: error2 } = await supabase.from('characters').select('id, name, player:profiles(id, name), portrait, open, storyteller, state, accepted').eq('player', user.id).is('game', null)
      if (error2) { return handleError(error2) }
      characters.myOpen = myOpen
    }
  })

  async function updateRecruitment () {
    const newData = { recruitment: data.recruitment }
    newData.characters_changed_at = new Date()
    const { error } = await supabase.from('games').update(newData).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }

  async function signExisting () {
    const { error } = await supabase.from('characters').update({ game: data.id, accepted: false }).eq('id', myOpenSelected)
    if (error) { return handleError(error) }
    window.location.href = window.location.href + '?toastType=success&toastText=' + encodeURIComponent('Postava byla přihlášena do hry')
  }
</script>

<main>
  <h2>Vypravěči</h2>
  <table class='characters'>
    {#if isFilledArray(characters.storytellers)}
      <CharacterHeader {isGameOwner} />
      {#each characters.storytellers as character}
        <Character {user} {character} {isGameOwner} {isStoryteller} gameId={data.id} />
      {/each}
    {:else}
      <td class='none'>Žádní vypravěči</td>
    {/if}
  </table>

  <h2>Ve hře</h2>
  <table class='characters'>
    {#if isFilledArray(characters.playing)}
      <CharacterHeader {isGameOwner} />
      {#each characters.playing as character}
        <Character {user} {character} {isGameOwner} {isStoryteller} gameId={data.id} />
      {/each}
    {:else}
      <tr><td class='none'>Žádné postavy</td></tr>
    {/if}
  </table>
  <div class='note'><span class='material'>info</span>Novou postavu vidí jen vypravěči, dokud nenapíše veřejný příspěvek.</div>

  <hr>

  <h1>Nábor</h1>
  <EditableLong userId={user.id} bind:value={data.recruitment} onSave={updateRecruitment} canEdit={isStoryteller} enterSend={false} allowHtml />
  <br>
  {#if isGameOwner || isFilledArray(characters.waiting)}
    <h2>Hlásí se</h2>
    <table class='characters'>
      {#if isFilledArray(characters.waiting)}
        <CharacterHeader {isGameOwner} />
        {#each characters.waiting as character}
          <Character {user} {character} {isGameOwner} {isStoryteller} gameId={data.id} />
        {/each}
      {:else}
        <tr><td class='none'>Žádné postavy</td></tr>
      {/if}
    </table>
  {/if}

  <h2>Volné postavy k převzetí</h2>
  <table class='characters'>
    {#if isFilledArray(characters.open)}
      <CharacterHeader {isGameOwner} />
      {#each characters.open as character}
        <Character {user} {character} {isGameOwner} {isStoryteller} gameId={data.id} />
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
      <a href={window.location.origin + '/game/character-form?game=' + data.id} class='button large'>Vytvořit novou postavu</a>
    </div>
  {/if}
</main>

<style>
  main {
    padding-top: 40px;
  }
  hr {
    height: 10px;
    background-color: var(--background);
    border: none;
    margin: 60px -60px;
  }
  h2 {
    margin-top: 0px;
  }
  .note {
    font-style: italic;
    padding-left: 20px;
    margin-bottom: 40px;
    color: var(--dim);
    display: flex;
  }
    .note .material {
      margin-right: 10px;
    }
  .characters {
    width: 100%;
    margin-bottom: 50px;
  }
  .none {
    padding-left: 20px;
    color: var(--dim);
  }
  .row {
    display: flex;
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
    }
    .empty {
      opacity: 0.5;
    }
</style>
