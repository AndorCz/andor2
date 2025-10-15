<script>
  import md5 from 'crypto-js/md5'
  import { onMount } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import { showError } from '@lib/toasts'
  import { preventDefault } from 'svelte/legacy'

  let otp = $state('')
  let email = $state('')
  let oldLogin = $state('')
  let newLogin = $state('')
  let password1 = $state('')
  let password2 = $state('')
  let oldPassword = $state('')
  let isConfirming = $state(false)
  let showOtp = $state(false)
  let showImport = $state(false)
  // let captchaToken = ''

  onMount(() => {
    try {
      /*
      window.turnstile.ready(() => {
        window.turnstile.render('#captchaEl', { sitekey: import.meta.env.PUBLIC_TURNSTILE_SITEKEY, callback: (token) => { captchaToken = token } })
      })
      */
      // window.grecaptcha?.ready(async () => { captchaToken = await window.grecaptcha.execute('6LeGwKwpAAAAAPUzv6wpjauCabPEZp4YX8lfCivG', { action: 'submit' }) })
    } catch (e) { showError('Chyba při ověření reCAPTCHA' + e.message) }
  })

  /*
  async function verifyCaptcha () {
    const response = await fetch(`/api/auth/verify?token=${captchaToken}`, { method: 'GET' })
    if (!response.ok) { showError('Chyba při ověření reCAPTCHA') }
    const data = await response.json()
    return response.ok && data.success
  }
  */

  async function signUpNewUser () {
    // if (!await verifyCaptcha()) { return showError('Captcha tvrdí že nejsi člověk. Prosím obnov stránku a zkus to znovu, nebo napiš na eskel.work@gmail.com') }
    if (password1.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    if (password1 !== password2) { return showError('Potvrzení hesla nesouhlasí') }
    const { data, error } = await supabase.auth.signUp({ email, password: password1, options: { emailRedirectTo: window.location.origin } }) // captchaToken
    if (error) { return handleError(error) }
    if (data.user) { showOtp = true }
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
    if (password1.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    if (password1 !== password2) { return showError('Potvrzení hesla nesouhlasí') }
    if (newLogin.length < 1) { return showError('Login musí mít alespoň 1 znak') }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLogin)) { return showError('Login nesmí být e-mailová adresa') }

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
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: password1, options: { emailRedirectTo: window.location.origin } })
    if (authError) { return handleError(authError) }
    if (authError || !authData) { return showError('Chyba registrace: ' + authError.message) }
    if (authData && authData.user) {
      showOtp = true
    }
  }

  async function verifyOtp () {
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
    if (error) { return handleError(error) }
    window.location.href = '/'
  }
</script>

<main>
  {#if showOtp}
    <div>
      <h1>Zkontroluj svůj e-mail</h1>
      <p>Na adresu <strong>{email}</strong> jsme ti poslali potvrzovací e-mail s přihlašovacím kódem.</p>
      <p class='note'>Pokud e-mail nevidíš, zkontroluj složku spam.</p>
      <input type='text' bind:value={otp} placeholder='Zadej kód z e-mailu' />
      <button type='button' onclick={verifyOtp} disabled={!otp || otp.length !== 6}>Potvrdit registraci</button>
    </div>
  {:else if !isConfirming}

    {#if !showImport}
      <div class='newUser'>
        <h1>Nová registrace</h1>
        <form onsubmit={preventDefault(signUpNewUser)}>
          <div class='row'>
            <label for='email'>E-mail</label>
            <input type='email' id='email' bind:value={email} />
          </div>
          <div class='row'>
            <label for='password'>Heslo</label>
            <input type='password' id='password1' bind:value={password1} />
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
      <div class='importPrompt'>
        <h3>Měl/a jsi účet na starém Andor.cz (A1)?</h3>
        <button type='button' onclick={() => { showImport = true }}>Importovat účet</button>
      </div>
    {:else}
      <div class='oldUser'>
        <a href='/signup'>&larr; Zpět na novou registraci</a>
        <h1>Uživatel Andor.cz (A1)</h1>
        <form onsubmit={preventDefault(validateUser)}>
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
    {/if}
  {:else}
    <div class='center'>
      <h1>Potvrzení importu</h1>
      <form onsubmit={preventDefault(signUpMigrate)}>
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
          <input type='password' id='password1' bind:value={password1} />
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
  <hr>
</main>
<br><br>
<center>Registrací souhlasíš se <a href='/privacy' target='_blank'>zpracováním osobních údajů</a> (emailu).</center>
<div id='captchaEl'></div>

<style>
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
  .importPrompt {
    margin: 40px auto;
    padding: 20px;
    text-align: center;
    border-radius: 20px;
    border: 1px solid var(--overlay);
    background-color: var(--block);
  }
    .importPrompt h3 {
      margin: 0px;
    }
</style>
