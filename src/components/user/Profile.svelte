<script>
  import { tooltip } from '@lib/tooltip'
  import { activeConversation } from '@lib/stores'
  import { getPortraitUrl, supabase } from '@lib/database-browser'
  import { showSuccess, showError } from '@lib/toasts'
  import GameList from '@components/games/GameList.svelte'
  import SoloList from '@components/solo/SoloList.svelte'
  import WorkList from '@components/works/WorkList.svelte'
  import BoardList from '@components/boards/BoardList.svelte'
  import DOMPurify from 'dompurify'
  import Editor from '@components/common/Editor.svelte'

  let { user = {}, data = $bindable({}) } = $props()

  const genderLabels = { man: 'Muž', woman: 'Žena', other: 'Jiné' }
  const isOwner = $derived(user.id && user.id === data.id)

  let isEditing = $state(false)
  let editCity = $state('')
  let editGender = $state('')
  let editAbout = $state('')

  function startEdit () {
    editCity = data.city || ''
    editGender = data.gender || ''
    editAbout = data.about || ''
    isEditing = true
  }

  function cancelEdit () {
    isEditing = false
  }

  async function saveProfile () {
    const { error } = await supabase.from('profiles').update({
      city: editCity || null,
      gender: editGender || null,
      about: editAbout || null
    }).eq('id', data.id)
    if (error) { return showError(error.message) }
    data.city = editCity || null
    data.gender = editGender || null
    data.about = editAbout || null
    isEditing = false
    showSuccess('Profil byl uložen')
  }

  function openConversation () {
    $activeConversation = { us: user, them: data, type: 'user' }
  }
</script>

<main>
  {#if data.portrait}
    <aside>
      <img src={getPortraitUrl(data.id, data.portrait)} class='portrait' alt={data.name} />
    </aside>
  {/if}
  <div class='wide'>
    <h1>
      {data.name}
      {#if isOwner}
        <button onclick={startEdit} class='material editBtn' title='Upravit profil' use:tooltip>edit</button>
      {/if}
    </h1>
    <ul>
      {#if data.city}<li>Město: <span class='value'>{data.city}</span></li>{/if}
      {#if data.gender}<li>Pohlaví: <span class='value'>{genderLabels[data.gender] || data.gender}</span></li>{/if}
      <li>Naposledy online: <span class='date'>{new Date(data.last_activity).toLocaleString('cs')}</span></li>
      <li>Datum registrace: <span class='date'>{new Date(data.created_at).toLocaleDateString('cs')}</span></li>
    </ul>
    {#if user.id && user.id !== data.id}
      <button onclick={openConversation}>Napsat zprávu</button>
    {/if}
  </div>
</main>

{#if isEditing}
  <section class='editSection'>
    <h2>Upravit profil</h2>
    <div class='row'>
      <div class='label'><label for='editCity'>Město</label></div>
      <div class='value'><input type='text' id='editCity' size='30' maxlength='100' bind:value={editCity} /></div>
    </div>
    <br>
    <div class='row'>
      <div class='label'><label for='editGender'>Pohlaví</label></div>
      <div class='value'>
        <select bind:value={editGender} id='editGender' name='editGender'>
          <option value=''>— neuvedeno —</option>
          <option value='man'>Muž</option>
          <option value='woman'>Žena</option>
          <option value='other'>Jiné</option>
        </select>
      </div>
    </div>
    <br>
    <div class='aboutRow'>
      <label for='editAbout'>O mě</label>
      <div class='aboutEditor'>
        <!-- onChange is required: Editor calls it unconditionally in its $effect -->
        <Editor bind:value={editAbout} {user} minHeight={140} onChange={() => {}} />
      </div>
    </div>
    <br>
    <div class='editActions'>
      <button onclick={saveProfile} class='material' title='Uložit' use:tooltip>check</button>
      <button onclick={cancelEdit} class='material' title='Zrušit' use:tooltip>close</button>
    </div>
  </section>
{:else if data.about}
  <section class='about'>
    <h2>O mně</h2>
    <div class='about-content'>{@html DOMPurify.sanitize(data.about, { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })}</div>
  </section>
{/if}

<h2>Hry</h2>
<GameList {user} games={data.games} showTabs={false} />

<h2>Sólo koncepty</h2>
<SoloList {user} concepts={data.concepts} showTabs={false} />

<h2>Diskuze</h2>
<BoardList {user} boards={data.boards} />

<h2>Díla</h2>
<WorkList {user} works={data.works} />

<style>
  main {
    display: flex;
    align-items: center;
  }
    aside {
      margin-right: 40px;
    }
    .wide {
      flex: 1;
    }
    .portrait {
      border-radius: 10px;
      max-height: 300px;
    }
    ul {
      list-style: none;
      padding: 0px;
    }
      li {
        margin: 5px 0px;
      }
      .date, .value {
        font-weight: bold;
        margin-left: 10px;
      }
  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .editBtn {
    font-size: 20px;
    padding: 4px 8px;
  }
  .editSection {
    margin-top: 30px;
  }
  .row {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .label {
    padding-right: 20px;
    width: 150px;
  }
  select {
    width: fit-content;
    min-width: 280px;
    padding-right: 50px;
  }
  .aboutRow {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .aboutEditor {
    width: 100%;
  }
  .editActions {
    display: flex;
    gap: 10px;
  }
  .about {
    margin-top: 30px;
  }
  .about-content {
    max-width: 800px;
  }
</style>
