<script>
  import { supabase, handleError } from "@lib/database";
  import { showError } from "@lib/toasts";

  let email = "";
  let login = "";
  let old_login = "";
  let old_password = "";
  let password = "";
  let password2 = "";
  let old_id = "";
  let isRegistering = true;
  let isConfirming = false;

  async function importUser() {
    const response = await fetch("/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "import", old_login, old_password }),
    });
    if (response.ok) {
      const data = await response.json();
      email = data.userInfo.old_email;
      old_id = data.userInfo.old_id;
      isConfirming = true;
      login = old_login;
    } else {
      return showError("Uživatel nenalazen nebo nesprávne heslo.");
    }
  }

  async function signUpNewUserMigrate() {
    if (password.length < 6) {
      return showError("Heslo musí mít alespoň 6 znaků");
    }

    if (password !== password2) {
      return showError("Potvrzení hesla nesouhlasí");
    }

    const response = await fetch("/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "signup",
        email,
        login,
        password,
        old_password,
        old_login,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      // All good, redirect
      window.location.href =
        "/?toastType=success&toastText=" +
        encodeURIComponent(
          "Prosím zkontroluj svůj e-mail pro dokončení registrace.",
        );
    } else {
      return showError(data.error);

  async function signUpNewUser () {
    if (password.length < 6) { return showError('Heslo musí mít alespoň 6 znaků') }
    if (password !== password2) { return showError('Potvrzení hesla nesouhlasí') }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    if (error) { handleError(error) }
    if (data.user) {
      window.location.href = '/?toastType=success&toastText=' + encodeURIComponent('Prosím potvrď svůj e-mail pro dokončení registrace.')
    }
  }
</script>

<main>
  <h1>
    {#if isRegistering}Registrace{:else if !isConfirming}Migrace{:else}Potvrzení{/if}
  </h1>
  <center>
    <button
      on:click={() => (isRegistering = !isRegistering)}
      class="toggle-form"
    >
      {isRegistering ? "Migrace" : "Registrace nového uživatele"}
    </button>
  </center>

  {#if isRegistering}
    <form on:submit|preventDefault={signUpNewUser}>
      <div class="row">
        <label for="email">E-mail</label>
        <input type="email" id="email" bind:value={email} />
      </div>

      <div class="row">
        <label for="password">Heslo</label>
        <input type="password" id="password" bind:value={password} />
      </div>

      <div class="row">
        <label for="password">Potvrzení hesla</label>
        <input type="password" id="password2" bind:value={password2} />
      </div>

      <center>
        <button type="submit" class="large">Registrovat</button>
      </center>
    </form>
  {:else if !isConfirming}
    <form on:submit|preventDefault={importUser}>
      <div class="row">
        <label for="login">Login</label>
        <input type="text" id="old_login" bind:value={old_login} />
      </div>

      <div class="row">
        <label for="password">Heslo</label>
        <input type="password" id="old_password" bind:value={old_password} />
      </div>

      <center>
        <button type="submit" class="large">Importovat</button>
      </center>
    </form>
  {:else}
    <form on:submit|preventDefault={signUpNewUserMigrate}>
      <div class="row">
        <label for="email">Potvrzení E-mail</label>
        <input type="email" id="email" bind:value={email} />
      </div>
      <div class="row">
        <label for="old_login">Starý login</label>
        <input type="text" id="old_login" bind:value={old_login} readonly />
      </div>
      <div class="row">
        <label for="login">Nový login</label>
        <input type="text" id="login" bind:value={login} />
      </div>

      <div class="row">
        <label for="password">Nové Heslo</label>
        <input type="password" id="password" bind:value={password} />
      </div>

      <div class="row">
        <label for="password">Potvrzení hesla</label>
        <input type="password" id="password2" bind:value={password2} />
      </div>

      <center>
        <button type="submit" class="large">Importovat</button>
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
