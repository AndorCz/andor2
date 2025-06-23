<script>
  import { preventDefault } from 'svelte/legacy'

  import { onMount } from 'svelte'
  import { showError } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database-browser'
  import { redirectWithToast } from '@lib/utils'

  let email = $state('')
  let password = $state('')
  let password2 = $state('')
  let resetConfirmed = $state(false)

  async function resetPassword () {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset' })
    if (error) { handleError(error) }
    if (data) {
      email = ''
      redirectWithToast({ toastType: 'success', toastText: 'Prosím potvrď svůj e-mail pro dokončení obnovy hesla.' })
    }
  }

  async function updatePassword () {
    if (password !== password2) { return showError('Potvrzení hesla nesouhlasí') }
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) { handleError(error) }
    if (data.user) {
      redirectWithToast({ toastType: 'success', toastText: 'Heslo bylo úspěšně změněno.' })
    }
  }

  onMount(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') { resetConfirmed = true }
    })
  })
</script>

<main>

  <h1>Obnovení hesla</h1>

  {#if resetConfirmed}
    <form onsubmit={preventDefault(updatePassword)}>
      <div class='row'>
        <label for='password'>Nové heslo</label>
        <input type='password' id='password' bind:value={password} />
      </div>

      <div class='row'>
        <label for='password'>Potvrzení hesla</label>
        <input type='password' id='password2' bind:value={password2} />
      </div>

      <center>
        <button type='submit' class='large'>Uložit heslo</button>
      </center>
    </form>
  {:else}
    <form onsubmit={preventDefault(resetPassword)}>
      <div class='row'>
        <label for='email'>E-mail</label>
        <input type='email' id='email' bind:value={email} />
      </div>

      <center>
        <button type='submit' class='large'>Poslat odkaz na e-mail</button>
      </center>
    </form>
  {/if}
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
