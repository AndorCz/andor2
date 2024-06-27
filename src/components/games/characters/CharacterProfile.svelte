<script>
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import { showSuccess } from '@lib/toasts'
  import { Render } from '@jill64/svelte-sanitize'
  import { tooltip } from '@lib/tooltip'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let isStoryteller
  export let character = {}
  export let user = {}

  const isPlayer = user.id === character.player
  let originalStoryteller = character.storyteller
  let originalColor = character.color

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

{#if isPlayer || isStoryteller}
  <main>
    <aside>
      {#if character.portrait}
        <img src={getPortraitUrl(character.id, character.portrait)} class='portrait' alt={character.name} />
      {/if}
    </aside>

    <div class='wide'>
      <h1>{character.name}</h1>

      <h2>Vzhled</h2>
      <p class='content appearance'>{character.appearance || ''}</p>

      <h2>Životopis</h2>
      <p class='content bio'>
        <Render html={character.bio || ''} />
      </p>

      {#if isPlayer}
        <center>
          <a href={`/game/character-form?id=${character.id}`} class='button large' title='Upravit'>Upravit postavu</a>
        </center>
      {/if}

      {#if character.storyteller_notes || isStoryteller}
        <h2>Poznámky vypravěče <span class='material' title={'Tyto poznámky vidí vypravěči i hráč, ale jen vypravěč je může upravit.'} use:tooltip>info</span></h2>
        <EditableLong onSave={updateStorytellerNotes} canEdit={isStoryteller} {user} value={character.storyteller_notes} allowHtml />
      {/if}

      {#if isStoryteller}
        <div class='row'>
          <div class='col'>
            <h2>Status vypravěče</h2>
            <div class='rowCenter'>
              <div class='inputs'><input type='checkbox' id='storyteller' name='storyteller' bind:checked={character.storyteller} /></div>
              <button on:click={updateCharacter} class='material square' disabled={originalStoryteller === character.storyteller} title='Uložit' use:tooltip>check</button>
            </div>
          </div>
          <div class='col'>
            <h2>Barva jména</h2>
            <div class='rowCenter'>
              <input type='color' id='nameColor' name='nameColor' bind:value={character.color} />
              <input type='text' bind:value={character.color}>
              <button on:click={updateCharacter} class='material square' disabled={originalColor === character.color} title='Uložit' use:tooltip>check</button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </main>
{:else}
  <p>Jen vypravěč může vidět podrobnosti o postavě</p>
{/if}

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
</style>
