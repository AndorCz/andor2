<script>
  import { supabase, handleError } from '@lib/database'
  import { showError } from '@lib/toasts'

  let email = ''
  let password = ''
  let password2 = ''

  async function signUpNewUser () {
    if (password !== password2) { return showError('Potvrzení hesla nesouhlasí') }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    if (error) { handleError(error) }
    if (data.user) {
      window.location.href = '/?toastType=success&toastText=' + encodeURIComponent('Prosím zkontroluj svůj e-mail pro dokončení registrace.')
    }
  }
</script>

<main>

  <h1>Registrace</h1>

  <form on:submit|preventDefault={signUpNewUser}>
    <div class='row'>
      <label for='email'>E-mail</label>
      <input type='email' id='email' bind:value={email} />
    </div>

    <div class='row'>
      <label for='password'>Heslo</label>
      <input type='password' id='password' bind:value={password} />
    </div>

    <div class='row'>
      <label for='password'>Potvrzení hesla</label>
      <input type='password' id='password2' bind:value={password2} />
    </div>

    <center>
      <button type='submit' class='large'>Registrovat</button>
    </center>
  </form>
</main>

<style>
  form {
    margin: auto;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .row {
    display: flex;
    align-items: center;
  }

  label {
    display: block;
    width: 200px;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
  }

  button {
    margin-top: 20px;
  }
</style>
