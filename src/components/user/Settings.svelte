<script>
  import { showSuccess, showError } from '@lib/toasts'
  import { supabase } from '@lib/database'

  export let user

  let password = ''
  let password2 = ''

  async function setPassword () {
    if (password.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) { return showError(error.message) }
    if (data) { showSuccess('Heslo bylo úspěšně změněno') }
    password = ''
    password2 = ''
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
{:else}
  <h1>Uživatel nenalezen</h1>
{/if}

<style>
  h2 {
    margin-top: 50px;
    margin-bottom: 0px;
  }
  table {
    border-collapse: separate;
    border-spacing: 0 1em;
  }
  tr {
    margin-bottom: 20px;
  }
  .label {
    padding-right: 20px;
  }
  .row {
    display: flex;
    gap: 20px;
  }
</style>
