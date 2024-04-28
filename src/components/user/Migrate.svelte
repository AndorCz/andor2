<script>
    import { supabase } from "@lib/database";
    import { showError } from "@lib/toasts";
    import { getOldUserId } from "@mig/migrate";

    export let user, oldUserData;

    let oldLogin = "";
    let oldId = "";
    let oldPassword = "";

    if (oldUserData) {
        oldId = oldUserData.old_id;
        oldLogin = oldUserData.old_login;
    }

    async function linkUserToOldAccount() {
        oldId = await getOldUserId(oldLogin, oldPassword);
        if (oldId) {
            // Check if its not already linked
            const { data: idCheck, error: idError } = await supabase
                .from("profiles")
                .select("old_id")
                .eq("old_id", parseInt(oldId, 10))
                .maybeSingle();
            if (idCheck) {
                return showError(
                    `Id původního uživatele ${oldLogin} je již spojeno s jiným účtem. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to.`,
                );
            } else {
                // update profiles with old_id
                const { data: updateData, error: updateError } = await supabase
                    .from("profiles")
                    .update({ old_id: parseInt(oldId, 10) })
                    .eq("id", user.id)
                    .maybeSingle();
                if (updateError) {
                    showError("Error updating profile:", updateError);
                } else {
                    // update successfull, refresh page
                    window.location.href = '/migrate?toastType=success&toastText=' + encodeURIComponent('Úspešně propojeno!')
                }
            }
        } else {
            showError(
                "Uživatel nenalezen nebo špatné heslo - pozor na velké, malé písmena.",
            );
        }
    }
</script>

{#if user.id}
    {#if user.old_id}
        <h1>Migrace</h1>
        <p>
            Tvůj starej login je: <b> {oldLogin} </b>
        </p>
        <p>
            Tohle okno slouží na migraci dat ze starého andoru. Pokud tvůj
            starej login nesouhlasí, kontaktuj nás prosím.
        </p>
    {:else}
        <h1>Propojení účtu</h1>
        <p>
            Tohle okno slouží na propojení účtů. Pokud zadáš login a heslo ze
            starého andoru, budeme moci tvé účty propojit. Pokud tvůj starej
            login nesouhlasí nebo je zde jiný problém, kontaktuj podporu.
        </p>
        <div>
            <form
                on:submit|preventDefault={linkUserToOldAccount}
                autocomplete="off"
            >
                <div class="row">
                    <label for="login_link">Login</label>
                    <input
                        type="text"
                        id="oldLoginLink"
                        bind:value={oldLogin}
                    />
                </div>
                <div class="row">
                    <label for="password_old">Heslo</label>
                    <input
                        type="password"
                        id="oldPasswordLink"
                        bind:value={oldPassword}
                    />
                </div>
                <center>
                    <button type="submit" class="large">Propojit účty</button>
                </center>
            </form>
        </div>
    {/if}
{:else}
    <h1>Nejsi přihlášen</h1>
{/if}
