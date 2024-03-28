import { getOldUserInfo } from '@mig/migrate.js';
import { supabase } from "@lib/database";

export const POST = async ({ request }) => {
    
    try {
        const { action, login, password, email, old_password, old_login } = await request.json();
        switch (action) {
            case 'import':
                const userInfo = await getOldUserInfo(old_login, old_password);
                if (userInfo) {
                    // User found
                    //console.log("Found")
                    return new Response(JSON.stringify({ userInfo }), { status: 200 });
                } else {
                    // User not found
                    //console.log("Not found")
                    return new Response(JSON.stringify({ error: "Uživatel nenalezen" }), { status: 404 });
                }
            case 'signup':

                // get old_id again - do not trust whatever user would send
                const userInfoMigrate = await getOldUserInfo(old_login, old_password);

                const old_id = userInfoMigrate.old_id
                const { data: idCheck, error: idError } = await supabase
                .from("profiles")
                .select("old_id")
                .eq("old_id", parseInt(old_id,10))
                .maybeSingle();

                if (idCheck) {
                return new Response(JSON.stringify({ error:`Id původního uživatele ${old_login} je již spojeno s jiným účtem. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to.` }), { status: 409 });
                }    

                const { data: profileCheck, error: profileError } = await supabase
                .from("profiles")
                .select("name")
                .eq("name", old_login)
                .maybeSingle();

              if (profileCheck) {
                return new Response(JSON.stringify({ error: "Toto jméno je již zabrané. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to." }), { status: 409 });
              }

              // register user
              const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
              });

              if (authError) {
                console.error(authError)
                return new Response(JSON.stringify({ error:"Chyba u registrace" }), { status: 400 });
              } else if (authData && authData.user) {
                const { data: profileData, error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, name: login, old_id: old_id })

                return new Response(JSON.stringify({}), { status: 200 });
              }

            default:
                return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });

        }
    } catch (error) {
        // Handle unexpected errors
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};