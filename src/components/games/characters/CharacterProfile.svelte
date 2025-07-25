<script>
  import DOMPurify from 'dompurify'
  import EditableLong from '@components/common/EditableLong.svelte'
  import { getHex } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'

  let { isStoryteller, character = $bindable({}), user = {} } = $props()

  const isPlayer = user.id === character.player
  let originalStoryteller = $state(character.storyteller)
  let originalColor = $state(character.color)

  const hexColor = $derived(getHex(character.color))

  async function updateStorytellerNotes (notes) {
    const { error } = await supabase.from('characters').update({ storyteller_notes: notes }).eq('id', character.id)
    if (error) { return handleError(error) }
    showSuccess('Poznámky vypravěče byly uloženy')
  }

  async function updateCharacter () {
    const { error } = await supabase.from('characters').update({ storyteller: character.storyteller, color: character.color }).eq('id', character.id)
    if (error) { return handleError(error) }
    originalStoryteller = character.storyteller
    originalColor = character.color
    showSuccess('Postava byl upravena')
  }
</script>

<main>
  <aside>
    {#if character.portrait}
      <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt={character.name} />
    {/if}
  </aside>

  <div class='wide'>
    <h1>{character.name}</h1>

    <h2>Veřejný vzhled</h2>
    <p class='content appearance'>
      {@html DOMPurify.sanitize(character.appearance || '')}
    </p>

    <h2>Životopis</h2>
    <p class='content bio'>
      {#if isPlayer || isStoryteller || character.open}
        {@html DOMPurify.sanitize(character.bio || '')}
      {:else}
        Jen vlastník postavy a vypravěč může číst životopis
      {/if}
    </p>

    {#if isPlayer}
      <center>
        <a href={`/game/character-form?id=${character.id}`} class='button large' title='Upravit'>Upravit postavu</a>
      </center>
    {/if}

    {#if isPlayer || isStoryteller}
      {#if character.storyteller_notes || isStoryteller}
        <h2>Poznámky vypravěče <span class='material' title='Tyto poznámky vidí vypravěči i hráč, ale jen vypravěč je může upravit.' use:tooltip>info</span></h2>
        <EditableLong onSave={updateStorytellerNotes} canEdit={isStoryteller} {user} value={character.storyteller_notes} allowHtml />
      {/if}
    {/if}

    {#if isStoryteller}
      <div class='row'>
        <div class='col'>
          <h2>Status vypravěče</h2>
          <div class='rowCenter'>
            <div class='inputs'><input type='checkbox' id='storyteller' name='storyteller' bind:checked={character.storyteller} /></div>
            <button onclick={updateCharacter} class='material square' disabled={originalStoryteller === character.storyteller} title='Uložit' use:tooltip>check</button>
          </div>
        </div>
        <div class='col'>
          <h2>Barva jména</h2>
          <div class='rowCenter'>
            <input type='color' id='nameColor' name='nameColor' value={hexColor} oninput={(e) => { character.color = getHex(e.target.value) }} />
            <input type='text' bind:value={character.color}>
            <button onclick={updateCharacter} class='material square' disabled={originalColor === character.color} title='Uložit' use:tooltip>check</button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    display: flex;
    gap: 40px;
  }
    .portrait {
      margin-top: 30px;
      border-radius: 10px;
    }
  .wide {
    flex: 1;
  }
    h2 {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .content {
      background-color: var(--block);
    }
    .appearance, .bio {
      padding: 20px;
    }
  center {
    padding: 40px;
  }
  .row, .rowCenter {
    display: flex;
    gap: 10px;
  }
  .rowCenter {
    align-items: center;
  }
  .col {
    flex: 1;
  }
  @media (max-width: 800px) {
    main, .row {
      flex-direction: column;
      max-width: 100vw;
    }
  }
  h1, aside {
    margin-top: 0px;
    text-align: center;
  }
</style>
