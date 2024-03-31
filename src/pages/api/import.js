
import { getOldUserInfo } from '@mig/migrate.js'

export const POST = async ({ request, locals }) => {
  try {
    const { action, oldLogin, oldPassword, email, password } = await request.json()

    switch (action) {
      case 'validate': {
        const userInfo = await getOldUserInfo(oldLogin, oldPassword)
        if (userInfo) { // User found
          return new Response(JSON.stringify({ userInfo }), { status: 200 })
        } else { // User not found
          return new Response(JSON.stringify({ error: 'Uživatel nenalezen' }), { status: 404 })
        }
      }
      case 'signup': {
        const userInfoMigrate = await getOldUserInfo(oldLogin, oldPassword)
        const oldId = userInfoMigrate.old_id
        const { data: idCheck, error: idError } = await locals.supabase.from('profiles').select('old_id').eq('old_id', parseInt(oldId, 10)).maybeSingle()
        if (idError) { return new Response(JSON.stringify({ error: idError.message }), { status: 500 }) }

        if (idCheck) {
          return new Response(
            JSON.stringify({ error: `Id původního uživatele ${oldLogin} je již spojeno s jiným účtem. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to.` }), { status: 409 }
          )
        }

        // 2DO: REWORK - CHECK FROM OLD DB IF USER NAME EXISTS
        /*
        const { data: profile, error: profileError } = await locals.supabase.from('profiles').select('name').eq('name', oldLogin).maybeSingle()
        if (profileError) { return new Response(JSON.stringify({ error: profileError.message }), { status: 500 }) }

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'Tvoje jméno chybí v naší databázi. Pokud ho máš na původním Andoru, napiš na eskel.work@gmail.com a vyřešíme to.' }),
            { status: 409 }
          )
        }
        */

        // register user
        const { data: authData, error: authError } = await locals.supabase.auth.signUp({ email, password })
        if (authError) { return new Response(JSON.stringify({ error: authError.message }), { status: 400 }) }

        if (authData && authData.user) {
          const { data: profileData, error: profileError2 } = await locals.supabase.from('profiles').insert({ id: authData.user.id, name: oldLogin, old_id: oldId })
          if (profileError2) { return new Response(JSON.stringify({ error: profileError2.message }), { status: 500 }) }
          return new Response(JSON.stringify({ profileData }), { status: 200 })
        }
        break
      }
      default: return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}
