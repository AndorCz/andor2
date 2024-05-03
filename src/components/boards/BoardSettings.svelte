<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess, showError } from '@lib/toasts'
  import { supabase, handleError, userAutocomplete } from '@lib/database'
  import Select from 'svelte-select'
  import HeaderInput from '@components/common/HeaderInput.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let data = {}
  export let user = {}

  let saving = false
  let originalName
  let originalOpen
  let originalAnnotation
  let newMod
  let newBan
  let newMember
  let headlineEl

  onMount(() => {
    setOriginal()
    const observer = new IntersectionObserver(([e]) => e.target.classList.toggle('pinned', e.intersectionRatio < 1), { threshold: [1] })
    observer.observe(headlineEl)
  })

  function setOriginal () {
    originalName = data.name
    originalOpen = data.open
    originalAnnotation = data.annotation
  }

  async function updateBoard () {
    saving = true
    const { error } = await supabase.from('boards').update({ name: data.name, annotation: data.annotation, open: data.open }).eq('id', data.id)
    if (error) { return handleError(error) }
    setOriginal()
    showSuccess('Změna diskuze uložena')
    saving = false
  }

  async function deleteBoard () {
    const { error } = await supabase.from('boards').delete().eq('id', data.id)
    if (error) { return handleError(error) }
    window.location.href = '/boards?toastType=success&toastText=' + encodeURIComponent('Diskuze byla smazána')
  }

  function showBoard () {
    window.location.href = `/board/${data.id}`
  }

  async function addPerson (type, person) {
    if (data[type].find(p => p.id === person.id)) { showError('Tento uživatel už je v této skupině') }
    const newPeople = [...data[type], person.id]
    const { error } = await supabase.from('boards').update({ [type]: newPeople }).eq('id', data.id).single()
    if (error) { return handleError(error) }
    data[type] = newPeople
    newMod = null
    newBan = null
    newMember = null
  }

  async function removePerson (type, person) {
    const newPeople = data[type].filter(p => p !== person.id)
    const { error } = await supabase.from('boards').update({ [type]: newPeople }).eq('id', data.id).select()
    if (error) { return handleError(error) }
    data[type] = newPeople
  }

  async function loadUsers (name) {
    if (name.length < 3) { return [] }
    const results = await userAutocomplete(name)
    return results
  }

  async function getNames (ids) {
    const { data, error } = await supabase.rpc('get_user_names', { ids }).single()
    if (error) { return handleError(error) }
    return data
  }
</script>

<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/board/{data.id}' class='backlink'>{data.name}</a>
    <h1>Nastavení</h1>
    <button on:click={showBoard} class='material square back' title='Zpět do diskuze' use:tooltip>check</button>
  </div>
</div>
<main>
  <h2>Název</h2>
  <div class='row'>
    <input type='text' id='boardName' name='boardName' bind:value={data.name} maxlength='80' />
    <button on:click={updateBoard} disabled={saving || (originalName === data.name)} class='material square' title='Uložit' use:tooltip>check</button>
  </div>

  <h2>Anotace</h2>
  <div class='row'>
    <TextareaExpandable userId={user.id} id='gameAnnotation' name='gameAnnotation' bind:value={data.annotation} maxlength={150} />
    <button on:click={updateBoard} disabled={saving || originalAnnotation === data.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
  </div>

  <h2 class='first'>Vlastní hlavička</h2>
  Obrázek musí mít velikost alespoň 1100×226 px<br><br>
  <div class='row'>
    <label class='button' for='headerImage'>Nahrát obrázek</label>
    <HeaderInput {data} section='boards' unit='board' />
  </div>

  {#if data.open}
    <h2>Bany</h2>
    {#if data.bans && data.bans.length}
      {#await getNames(data.bans) then list}
        <ul>
          {#each list as ban}
            <li>
              <div class='ban item'>
                <h3>{ban.name}</h3>
                <button class='square material square' on:click={() => { removePerson('bans', ban) }} title='Odebrat uživatele' use:tooltip>delete</button>
              </div>
            </li>
          {/each}
        </ul>
      {/await}
    {:else}
      <p class='info'>Žádné bany</p>
    {/if}
    <h3><label for='boardAddBan'>Zakázat přístup</label></h3>
    <div class='row select'>
      <Select bind:value={newBan} loadOptions={loadUsers} label='name' placeholder='Jméno uživatele'>
        <div slot='empty'>Uživatel nenalezen</div>
      </Select>
      <button class='material square' on:click={() => { addPerson('bans', newBan) }} disabled={saving || !newBan?.id} title='Přidat uživatele' use:tooltip>add</button>
    </div>
  {:else}
    <h2>Členové</h2>
    {#if data.members && data.members.length}
      {#await getNames(data.members) then list}
        <ul>
          {#each list as member}
            <li>
              <div class='member item'>
                <h3>{member.name}</h3>
                <button class='square material square' on:click={() => { removePerson('members', member) }} title='Odebrat uživatele' use:tooltip>delete</button>
              </div>
            </li>
          {/each}
        </ul>
      {/await}
    {:else}
      <p class='info'>Žádní členové</p>
    {/if}
    <h3><label for='boardAddMember'>Přidat člena</label></h3>
    <div class='row select'>
      <Select bind:value={newMember} loadOptions={loadUsers} label='name' placeholder='Jméno uživatele'>
        <div slot='empty'>Uživatel nenalezen</div>
      </Select>
      <button class='material square' on:click={() => { addPerson('members', newMember) }} disabled={saving || !newMember?.id} title='Přidat uživatele' use:tooltip>add</button>
    </div>
  {/if}

  <h2 class='separator'><div class='lines'></div><span class='material owner'>star</span>Pouze pro vlastníka<div class='lines'></div></h2>

  {#if data.owner.id === user.id}
    <h2>Správci</h2>
    {#if data.mods && data.mods.length}
      {#await getNames(data.mods) then list}
        <ul>
          {#each list as mod}
            <li>
              <div class='mod item'>
                <h3>{mod.name}</h3>
                <button class='square material' on:click={() => { removePerson('mods', mod) }} title='Odebrat uživatele' use:tooltip>delete</button>
              </div>
            </li>
          {/each}
        </ul>
      {/await}
    {:else}
      <p class='info'>Žádní správci</p>
    {/if}
    <h3><label for='boardAddMod'>Přidat správce</label></h3>
    <div class='row select'>
      <Select bind:value={newMod} loadOptions={loadUsers} label='name' placeholder='Jméno uživatele'>
        <div slot='empty'>Uživatel nenalezen</div>
      </Select>
      <button class='material square' on:click={() => { addPerson('mods', newMod) }} disabled={saving || !newMod?.id}>add</button>
    </div>

    <h2>Přístupnost diskuze</h2>
    <div class='row'>
      <select id='boardOpen' name='boardOpen' bind:value={data.open}>
        <option value={true}>Veřejná</option>
        <option value={false}>Soukromá</option>
      </select>
      <button on:click={updateBoard} disabled={saving || (originalOpen === data.open)} class='material square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Smazání diskuze</h2>
    Pozor, toto je nevratná akce.<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tuto diskuzi?')) { deleteBoard() } }}>
      <span class='material'>warning</span><span>Smazat diskuzi</span>
    </button>
  {/if}
</main>

<style>
  .headline {
    position: sticky;
    top: -1px; /* needed for observer */
    background-color: var(--panel);
    padding-top: 10px;
    padding-bottom: 10px;
    margin: 0px -60px;
    z-index: 10;
  }
    .wrapper {
      max-width: 600px;
      margin: auto;
    }
      .headline .backlink {
        font-family: var(--headlineFont);
        display: inline-block;
        font-size: inherit;
      }
      .headline h1 {
        margin: 0px;
        margin-top: -5px;
        padding: 0px;
      }
      .back {
        position: absolute;
        top: 8px;
        right: 20px;
      }

  main {
    max-width: 600px;
    margin: auto;
  }

  h2 {
    margin-top: 50px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .delete {
    display: flex;
    gap: 10px;
  }
  input[type=text], select, .select {
    width: 100%;
  }

  ul {
    padding: 0px;
  }
    li {
      padding: 10px 20px;
      margin-bottom: 1px;
      list-style-type: none;
      background: var(--block);
    }
      .item {
        display: flex;
        align-items: center;
        gap: 20px;
      }
        ul h3 {
          width: 100%;
          margin: 10px 0px;
        }

  .separator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 80px;
    gap: 20px;
  }
    .separator .lines {
      flex: 1;
      border-top: 1px solid var(--text);
    }
  .owner {
    font-size: 18px;
  }

  @media (max-width: 1200px) {
    .headline {
      margin: 0px -30px;
    }
  }

  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
    .headline {
      margin: 0px -15px;
    }
  }
</style>
