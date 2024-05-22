<script>
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database'
  import { redirectWithToast } from '@lib/utils'
  import { showError } from '@lib/toasts'
  import md5 from 'crypto-js/md5'

  let email = ''
  let oldLogin = ''
  let oldPassword = ''
  let password = ''
  let password2 = ''
  let isConfirming = false
  let captchaToken = ''
  let newLogin = ''

  onMount(() => {
    try {
      window.grecaptcha?.ready(async () => { captchaToken = await window.grecaptcha.execute('6LeGwKwpAAAAAPUzv6wpjauCabPEZp4YX8lfCivG', { action: 'submit' }) })
    } catch (e) { showError('Chyba při ověření reCAPTCHA' + e.message) }
  })

  async function verifyCaptcha () {
    const response = await fetch(`/api/auth/verify?token=${captchaToken}`, { method: 'GET' })
    if (!response.ok) { showError('Chyba při ověření reCAPTCHA') }
    const data = await response.json()
    return response.ok && data.success
  }

  async function signUpNewUser () {
    if (!await verifyCaptcha()) { return showError('Captcha tvrdí že nejsi člověk. Prosím obnov stránku a zkus to znovu, nebo napiš na eskel.work@gmail.com') }
    if (password.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    if (password !== password2) { return showError('Potvrzení hesla nesouhlasí') }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    if (error) { return handleError(error) }
    if (data.user) { redirectWithToast({ toastType: 'success', toastText: 'Prosím potvrď svůj e-mail pro dokončení registrace.' }) }
  }

  async function validateUser () {
    // remove captcha when importing from old andor for now
    // if (!await verifyCaptcha()) { return showError('Captcha tvrdí že nejsi člověk. Prosím obnov stránku a zkus to znovu, nebo napiš na eskel.work@gmail.com') }
    const hashedPassword = md5(oldPassword).toString()
    const { data, error } = await supabase.from('old_users').select('old_email').eq('old_login', oldLogin.toLowerCase()).eq('old_psw', hashedPassword).maybeSingle()

    if (error) { return showError('Chyba čtení starých uživatelů: ' + error.message) }

    if (data) {
      email = data.old_email
      newLogin = oldLogin
      isConfirming = true
    } else {
      return showError('Uživatel nenalezen, nebo nesprávné heslo')
    }
  }

  async function signUpMigrate () {
    if (password.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    if (password !== password2) { return showError('Potvrzení hesla nesouhlasí') }
    if (newLogin.length < 1) { return showError('Login musí mít alespoň 1 znak') }

    // Get info about old user
    const hashedPassword = md5(oldPassword).toString()
    const { data: userInfoMigrate, error: userError } = await supabase.from('old_users').select('old_id, old_created_at').eq('old_login', oldLogin.toLowerCase()).eq('old_psw', hashedPassword).maybeSingle()
    if (userError || !userInfoMigrate) { return showError('Chyba čtení starých uživatelů: ' + userError.message) }

    // Check if user is already linked to some user
    const oldId = userInfoMigrate.old_id
    const { data: idCheck, error: idError } = await supabase.from('profiles').select('old_id').eq('old_id', parseInt(oldId, 10)).maybeSingle()
    if (idError) { return showError('Chyba čtení uživatelů: ' + idError.message) }
    if (idCheck) { return showError(`Id původního uživatele ${oldLogin} je již spojeno s jiným účtem. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to.`) }

    // Check if new login is available
    const { data: loginCheck, error: loginError } = await supabase.from('profiles').select('name').eq('name', newLogin.toLowerCase()).maybeSingle()
    if (loginError) { return showError('Chyba čtení uživatelů: ' + loginError.message) }
    if (loginCheck) { return showError('Login je už zabraný') }

    // Check if user is trying to claim login that belonged to someone else
    const { data: userExisted, error: userExistedError } = await supabase.from('old_users').select('old_id').eq('old_login', newLogin.toLowerCase()).not('old_id', 'eq', oldId).maybeSingle()
    if (userExistedError) { return showError('Chyba čtení uživatelů: ' + userExistedError.message) }
    if (userExisted) { return showError('Zdá se že se snažíš zabrat cizí login') }

    // Create user (All is good - we can proceed with registration)
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { return handleError(authError) }
    if (authError || !authData) { return showError('Chyba registrace: ' + authError.message) }
    if (authData && authData.user) {
      redirectWithToast({ toastType: 'success', toastText: 'Prosím zkontroluj svůj e-mail pro dokončení registrace' })
    }
  }
</script>

<main>
  {#if !isConfirming}
    <div class='newUser'>
      <h1>Nová registrace</h1>
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
    </div>

    <div class='divider'></div>

    <div class='oldUser'>
      <h1>Uživatel Andor.cz</h1>
      <form on:submit|preventDefault={validateUser}>
        <div class='row'>
          <label for='login'>Login</label>
          <input type='text' id='oldLogin' bind:value={oldLogin} />
        </div>
        <div class='row'>
          <label for='password'>Heslo</label>
          <input type='password' id='oldPassword' bind:value={oldPassword} />
        </div>
        <center>
          <button type='submit' class='large'>Importovat</button>
        </center>
      </form>
    </div>
  {:else}
    <div class='center'>
      <h1>Potvrzení importu</h1>
      <form on:submit|preventDefault={signUpMigrate}>
        <input type='hidden' id='oldLogin' value={oldLogin} />
        <div class='row'>
          <label for='email'>Login</label>
          <input type='text' id='newLogin' bind:value={newLogin} />
        </div>
        <div class='row'>
          <label for='email'>E-mail</label>
          <input type='email' id='email' bind:value={email} />
        </div>
        <div class='row'>
          <label for='password'>Nové Heslo</label>
          <input type='password' id='password' bind:value={password} />
        </div>
        <div class='row'>
          <label for='password'>Potvrzení hesla</label>
          <input type='password' id='password2' bind:value={password2} />
        </div>
        <center>
          <button type='submit' class='large'>Importovat</button>
        </center>
      </form>
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    justify-content: space-around;
    height: fit-content;
    gap: 40px;
  }
    form {
      margin: auto;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  .center {
    margin: auto;
  }
  .row {
    display: flex;
    align-items: center;
  }
  .divider {
    width: 5px;
    align-self: stretch;
    background-color: var(--block);
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

  @media (max-width: 600px) {
    main {
      flex-direction: column;
      gap: 40px;
    }
    .divider {
      display: none;
    }
  }
</style>
