<script>
  import { supabase } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import { getOldUserId } from '@mig/migrate'
  import MigrateGames from '@components/user/MigrateGames.svelte'
  import MigrateWorks from '@components/user/MigrateWorks.svelte'
  import MigrateCharacters from '@components/user/MigrateCharacters.svelte'

  export let user
  export let oldUserData

  let oldLogin = ''
  let oldId = ''
  let oldPassword = ''

  if (oldUserData) {
    oldId = oldUserData.old_id
    oldLogin = oldUserData.old_login
  }

  async function linkUserToOldAccount () {
    oldId = await getOldUserId(oldLogin, oldPassword)
    if (!oldId) { return showError('Uživatel nenalezen nebo špatné heslo - pozor na velká a malá písmena') }

    // Check if its not already linked
    const { data: idCheck, error: idError } = await supabase.from('profiles').select('old_id').eq('old_id', parseInt(oldId, 10)).maybeSingle()
    if (idError) { return showError('Chyba migrace: ', idError.message) }

    if (idCheck) {
      return showError(`Id původního uživatele ${oldLogin} je již spojeno s jiným účtem. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to.`)
    } else { // update profiles with old_id
      const { error: updateError } = await supabase.from('profiles').update({ old_id: parseInt(oldId, 10) }).eq('id', user.id).maybeSingle()
      if (updateError) {
        showError('Error updating profile:', updateError)
      } else { // update successfull, refresh page
        window.location.href = '/migrate?toastType=success&toastText=' + encodeURIComponent('Úspešně propojeno!')
      }
    }
  }

  async function handlePortrait (oldId) {
    if (oldId) {
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'import_user_portrait', oldId })
        })
        const result = await response.json()
        if (result.status === 200) {
          showSuccess('Ikonka nahrána, obnov stránku pro zobrazení')
        } else {
          showError('Ikonka nenahrána, někde je chyba')
        }
      } catch (error) {
        console.error('handlePortrait - error calling API:', error.message)
      }
    } else {
      showError('Chyba: Nemáš propojený účet s původním Andorem')
    }
  }

</script>

<main id='import'>
  {#if user.id}
    {#if user.old_id}
      <h1>Import</h1>
      <p>Tvůj starý login je: <b>{oldLogin}</b></p>
      <p>
        Tato stránka slouží k migraci dat ze starého Andoru. Pokud tvůj starý login nesouhlasí, kontaktuj prosím vývojáře.
        Kontakty najdeš v hlavičce diskuze <a href='/board/2' target='_blank'>Správa Andoru</a>.
      </p>
      <p><button on:click={() => handlePortrait(user.old_id)}>Importovat ikonku</button></p>
      <p>Přihlašovací heslo si musíš znovu nastavit a nově se jako přihlašovací jméno používá e-mail.</p>
      <MigrateGames {user} {oldUserData} />
      <br>
      <MigrateWorks {user} {oldUserData} />
      <br>
      <MigrateCharacters {user} {oldUserData} />
    {:else}
      <h1>Propojení účtu</h1>
      <p>Tato stránka slouží na propojení účtů. Pokud zadáš login a heslo ze starého Andoru, budeme moci tvé účty propojit.</p>

      <form on:submit|preventDefault={linkUserToOldAccount} autocomplete='off'>
        <div class='row'>
          <label for='login_link'>Login</label>
          <input type='text' id='oldLoginLink' bind:value={oldLogin} size='32' />
        </div>
        <div class='row'>
          <label for='password_old'>Heslo</label>
          <input type='password' id='oldPasswordLink' bind:value={oldPassword} size='32' />
        </div>
        <center>
          <button type='submit' class='large'>Propojit účty</button>
        </center>
      </form>

      <p class='info'>
        Pokud tvůj starý login nesouhlasí, nebo je zde jiný problém, kontaktuj prosím vývojáře.
        Kontakty najdeš v hlavičce diskuze <a href='/board/2' target='_blank'>Správa Andoru</a>.
      </p>
    {/if}
  {:else}
    <h1>Pouze pro přihlášené uživatele</h1>
  {/if}
</main>

<style>
  main {
    max-width: 600px;
    margin: auto;
    line-height: 140%;
  }
  center {
    margin: 20px 0px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 400px;
    margin: auto;
    margin-top: 40px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
</style>
