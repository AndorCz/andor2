<script>
  import { showSuccess, showError } from '@lib/toasts'
  import { activeConversation } from '@lib/stores'
  import { supabase } from '@lib/database-browser'
  import { tooltip } from '@lib/tooltip'
  import { getHex } from '@lib/utils'

  export let user

  let password = ''
  let password2 = ''
  let newEmail = user.email
  let originalAutorefresh = user.autorefresh
  let originalEditorBubble = user.editor_bubble
  let originalTheme = user.theme
  let newColor = ''

  async function setPassword () {
    if (password.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) { return showError(error.message) }
    if (data) { showSuccess('Heslo bylo úspěšně změněno') }
    password = ''
    password2 = ''
  }

  async function updateUser (theme = false) {
    const data = {
      autorefresh: user.autorefresh,
      editor_bubble: user.editor_bubble,
      theme: user.theme,
      colors: user.colors
    }
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
    if (error) { return showError(error.message) }
    originalAutorefresh = user.autorefresh
    originalEditorBubble = user.editor_bubble
    originalTheme = user.theme
    showSuccess('Nastavení bylo uloženo')
    if (theme) { window.location.href = '/settings' }
  }

  async function deleteUser () {
    if (!confirm('Opravdu chcete smazat svůj účet? Tato akce je nevratná.')) { return }
    $activeConversation = null
    document.cookie = 'sb-access-token=; Max-Age=-99999999;'
    document.cookie = 'sb-refresh-token=; Max-Age=-99999999;'
    await supabase.auth.signOut()
    window.location.href = '/api/auth/delete'
  }

  async function setEmail () {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) { return showError(error.message) }
    showSuccess('Ověřovací e-mail byl odeslán na novou adresu, změnu prosím potvrďte odkazem uvnitř')
  }

  function addColor () {
    if (newColor === '') { return }
    user.colors.push(newColor)
    user.colors = user.colors // trigger reactivity
    updateUser()
    newColor = ''
  }

  function removeColor (color) {
    user.colors = user.colors.filter(c => c !== color)
    user.colors = user.colors // trigger reactivity
    updateUser()
  }
</script>

<main>
  {#if user}
    <h1>Uživatelské nastavení</h1>

    <h2>Import z Andor.cz</h2>
    <p>
      Pokud jsi uživatel ze starého Andoru, můžeš si propojit účty a přenést si své hry a články.<br><br>
      <a href='/migrate' class='button'>Přejít na import</a>
    </p>

    <h2>Nastavit heslo</h2>
    <div class='row'>
      <div class='label'><label for='password'>Nové heslo</label></div>
      <div class='value'><input type='password' id='password' size='30' bind:value={password} /></div>
    </div>
    <br>
    <div class='row'>
      <div class='label'><label for='password2'>Potvrzení hesla</label></div>
      <div class='value'>
        <div class='rowInner'>
          <input type='password' id='password2' size='30' bind:value={password2} />
          <button on:click={setPassword} class='material' disabled={password === '' || password2 === '' || password !== password2}>check</button>
        </div>
      </div>
    </div>

    <h2>Změnit e-mail</h2>
    <div class='row'>
      <div class='label'><label for='email'>Nový e-mail</label></div>
      <div class='value'>
        <div class='rowInner'>
          <input type='email' id='email' size='30' bind:value={newEmail} />
          <button on:click={setEmail} class='material' disabled={user.email === newEmail}>check</button>
        </div>
      </div>
    </div>

    <h2>Vizuální styl</h2>
    <div class='rowInner'>
      <select bind:value={user.theme} id='theme' name='theme'>
        <option value='obsidian'>Obsidián (výchozí)</option>
        <option value='onyx'>Onyx (A1)</option>
      </select>
      <button on:click={updateUser} class='material' disabled={originalTheme === user.theme} title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Paleta nástrojů editoru</h2>
    <div class='rowInner'>
      <select bind:value={user.editor_bubble} id='bubbleMenu' name='bubbleMenu'>
        <option value={true}>Kontextová bublina</option>
        <option value={false}>Fixní řádek</option>
      </select>
      <button on:click={updateUser} class='material' disabled={originalEditorBubble === user.editor_bubble} title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Vlastní barvy</h2>
    <ul>
      {#each user.colors as color}
        <li>
          <div class='rowInner'>
            <input type='color' id='color' name='color' value={getHex(color)} on:input={(e) => { color = getHex(e.target.value) }} />
            <input type='text' bind:value={color}>
            <button on:click={updateUser} class='material square' title='Uložit' use:tooltip>check</button>
            <button on:click={() => { removeColor(color) }} class='material square' title='Smazat' use:tooltip>delete</button>
          </div>
        </li>
      {/each}
    </ul>
    <h3>Přidat barvu</h3>
    <div class='row'>
      <input type='color' id='nameColor' name='nameColor' bind:value={newColor} />
      <input type='text' bind:value={newColor}>
      <button on:click={addColor} class='material square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Auto-refresh herních příspěvků</h2>
    <div class='rowInner'>
      <select bind:value={user.autorefresh} id='autorefresh' name='autorefresh'>
        <option value={true}>Zapnuto</option>
        <option value={false}>Vypnuto</option>
      </select>
      <button on:click={updateUser} class='material' disabled={originalAutorefresh === user.autorefresh} title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Smazat účet</h2>
    <p>Smazáním účtu se odstraní veškerá data spojená s tímto účtem. Tato akce je nevratná.</p>
    <button on:click={deleteUser}>Smazat účet</button>
  {:else}
    <h1>Uživatel nenalezen</h1>
  {/if}
</main>

<style>
  main {
    max-width: 600px;
    margin: auto;
  }
  h2 {
    margin-top: 50px;
  }
  .label {
    padding-right: 20px;
    width: 150px;
  }
  .row, .rowInner {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .rowInner {
    align-items: center;
  }
  select {
    width: fit-content;
    min-width: 320px;
    padding-right: 50px;
  }
  ul {
    padding: 0px;
  }
    li {
      padding: 10px 20px;
      margin-bottom: 2px;
      list-style-type: none;
      background: var(--block);
    }
  @media (max-width: 600px) {
    .row {
      flex-direction: column;
      align-items: flex-start;
    }
    .label, .value {
      max-width: 100%;
    }
  }
  @media (max-width: 400px) {
    .rowInner {
      width: 100%;
    }
    select {
      min-width: initial;
      flex: 1;
    }
  }
</style>
