<script>
  import { supabase } from '@lib/database'
  import { showError } from '@lib/toasts'
  import { getOldUserId } from '@mig/migrate'
  import MigrateGames from "@components/user/MigrateGames.svelte";
  import MigrateWorks from "@components/user/MigrateWorks.svelte";

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
    if (!oldId) { return showError('Uživatel nenalezen nebo špatné heslo - pozor na velké, malé písmena.') }

    // Check if its not already linked
    const { data: idCheck, error: idError } = await supabase
      .from('profiles')
      .select('old_id')
      .eq('old_id', parseInt(oldId, 10))
      .maybeSingle()
    if (idError) { return showError('Chyba migrace: ', idError.message) }

    if (idCheck) {
      return showError(`Id původního uživatele ${oldLogin} je již spojeno s jiným účtem. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to.`)
    } else { // update profiles with old_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ old_id: parseInt(oldId, 10) })
        .eq('id', user.id)
        .maybeSingle()
      if (updateError) {
        showError('Error updating profile:', updateError)
      } else { // update successfull, refresh page
        window.location.href = '/migrate?toastType=success&toastText=' + encodeURIComponent('Úspešně propojeno!')
      }
    }
  }
</script>

{#if user.id}
  {#if user.old_id}
    <h1>Migrace</h1>
    <p>Tvůj starý login je: <b>{oldLogin}</b></p>
    <p>
      Tato stránka slouží k migraci dat ze starého Andoru. Pokud tvůj starý login nesouhlasí,
      kontaktuj prosím vývojáře - kontakty najdeš v hlavičce diskuze "Správa Andoru".
    </p>
    <MigrateGames {user} {oldUserData} />
    <br>
    <MigrateWorks {user} {oldUserData} />
  {:else}
    <h1>Propojení účtu</h1>
    <p>
      Tato stránka slouží na propojení účtů. Pokud zadáš login a heslo ze starého Andoru, budeme moci tvé účty propojit.
      Pokud tvůj starý login nesouhlasí, nebo je zde jiný problém, kontaktuj prosím vývojáře - kontakty najdeš v hlavičce diskuze "Správa Andoru".
    </p>
    <div>
      <form on:submit|preventDefault={linkUserToOldAccount} autocomplete='off'>
        <div class='row'>
          <label for='login_link'>Login</label>
          <input type='text' id='oldLoginLink' bind:value={oldLogin}/>
        </div>
        <div class='row'>
          <label for='password_old'>Heslo</label>
          <input type='password' id='oldPasswordLink' bind:value={oldPassword} />
        </div>
        <center>
          <button type='submit' class='large'>Propojit účty</button>
        </center>
      </form>
    </div>
  {/if}
{:else}
  <h1>Pouze pro přihlášené uživatele</h1>
{/if}
