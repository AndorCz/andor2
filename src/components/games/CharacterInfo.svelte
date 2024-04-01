<script>
  import { supabase, handleError, getPortrait } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import { Render } from '@jill64/svelte-sanitize'
  import { tooltip } from '@lib/tooltip'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let isStoryteller
  export let character = {}
  export let user = {}

  const isPlayer = user.id === character.player
  let originalStoryteller = character.storyteller

  async function updateStorytellerNotes (notes) {
    const { error } = await supabase.from('characters').update({ storyteller_notes: notes }).eq('id', character.id)
    if (error) { return handleError(error) }
    showSuccess('Poznámky vypravěče byly uloženy')
  }

  async function updateCharacter () {
    const { error } = await supabase.from('characters').update({ storyteller: character.storyteller }).eq('id', character.id)
    if (error) { return handleError(error) }
    originalStoryteller = character.storyteller
    showSuccess('Postava byl upravena')
  }
</script>

{#if isPlayer || isStoryteller}
  <main>
    <aside>
      {#if character.portrait}
        {#await getPortrait(character.id, character.portrait) then url}<img src={url} class='portrait' alt={character.name} />{/await}
      {/if}
    </aside>

    <div class='wide'>
      <h1>{character.name}</h1>

      <h2>Vzhled</h2>
      <p class='content appearance'>{character.appearance}</p>

      <h2>Životopis</h2>
      <p class='content bio'>
        <Render html={character.bio} />
      </p>

      {#if character.storyteller_notes || isStoryteller}
        <h2 class='withIcon'>Poznámky vypravěče <span class='material' title={'Tyto poznámky vidí vypravěči i hráč, ale jen vypravěč je může upravit.'} use:tooltip>info</span></h2>
        <EditableLong onSave={updateStorytellerNotes} canEdit={isStoryteller} userId={user.id} value={character.storyteller_notes} allowHtml />
      {/if}

      {#if isStoryteller}
        <h2>Status vypravěče</h2>
        <div class='row'>
          <div class='inputs'><input type='checkbox' id='storyteller' name='storyteller' bind:checked={character.storyteller} /></div>
          <button on:click={updateCharacter} class='material square' disabled={originalStoryteller === character.storyteller}>check</button>
        </div>
      {/if}

      {#if isPlayer}
        <center>
          <a href={`/game/character-form?id=${character.id}`} class='button large' title='Upravit'>Upravit postavu</a>
        </center>
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
    .content {
      background-color: var(--block);
    }
    .appearance {
      padding: 20px;
    }
    .bio {
      padding: 1px 20px;
    }
    .withIcon {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  center {
    padding-top: 40px;
  }
  .row {
    display: flex;
    gap: 10px;
  }
</style>
