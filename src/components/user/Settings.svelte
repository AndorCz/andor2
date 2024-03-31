<script>
  import { showSuccess, showError } from '@lib/toasts'
  import { supabase } from '@lib/database'

  export let user

  let password = ''
  let password2 = ''
  let originalAutorefresh = user.autorefresh

  async function setPassword () {
    if (password.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) { return showError(error.message) }
    if (data) { showSuccess('Heslo bylo úspěšně změněno') }
    password = ''
    password2 = ''
  }

  async function updateUser () {
    const { error } = await supabase.from('profiles').update({ autorefresh: user.autorefresh }).eq('id', user.id)
    if (error) { return showError(error.message) }
    originalAutorefresh = user.autorefresh
    showSuccess('Nastavení bylo uloženo')
  }

  async function deleteUser () {
    if (!confirm('Opravdu chcete smazat svůj účet?')) { return }
    const { error } = await supabase.auth.delete()
    if (error) { return showError(error.message) }
    showSuccess('Účet byl úspěšně smazán')
  }
</script>

{#if user}
  <h1>Uživatelské nastavení</h1>

  <h2>Nastavit heslo</h2>
  <table>
    <tr>
      <td class='label'><label for='password'>Nové heslo</label></td>
      <td class='value'><input type='password' id='password' size='30' bind:value={password} /></td>
    </tr>
    <tr>
      <td class='label'><label for='password2'>Potvrzení hesla</label></td>
      <td class='value'>
        <div class='row'>
          <input type='password' id='password2' size='30' bind:value={password2} />
          <button on:click={setPassword} class='material' disabled={password === '' || password2 === '' || password !== password2}>check</button>
        </div>
      </td>
    </tr>
  </table>

  <h2>Automatický refresh příspěvků</h2>
  <div class='row'>
    <div class='inputs'><input type='checkbox' id='autorefresh' name='autorefresh' bind:checked={user.autorefresh} /></div>
    <button on:click={updateUser} class='material square' disabled={originalAutorefresh === user.autorefresh}>check</button>
  </div>

  <h2>Smazat účet</h2>
  <p>Smazáním účtu se odstraní veškerá data spojená s tímto účtem. Tato akce je nevratná.</p>
  <button on:click={deleteUser}>Smazat účet</button>
{:else}
  <h1>Uživatel nenalezen</h1>
{/if}

<style>
  h2 {
    margin-top: 50px;
  }
  td {
    margin-bottom: 20px;
    padding-bottom: 20px;
  }
  .label {
    padding-right: 20px;
  }
  .row {
    display: flex;
    gap: 20px;
  }
</style>
