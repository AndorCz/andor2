import * as OneSignal from 'https://esm.sh/@onesignal/node-onesignal@1.0.0-beta9'
// import * as OneSignal from 'https://esm.sh/@onesignal/node-onesignal@2.0.1-beta2' // bad
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// env debug
console.log('ONESIGNAL_USER_AUTH', Deno.env.get('ONESIGNAL_USER_AUTH'))
console.log('ONESIGNAL_API_KEY', Deno.env.get('ONESIGNAL_API_KEY'))
console.log('ONESIGNAL_APP_ID', Deno.env.get('ONESIGNAL_APP_ID'))

const configuration = OneSignal.createConfiguration({
  userKey: Deno.env.get('ONESIGNAL_USER_AUTH'),
  appKey: Deno.env.get('ONESIGNAL_API_KEY')
})

const oneSignalClient = new OneSignal.DefaultApi(configuration)

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const record = req.body ? (await req.json()).record : new Response('No JSON payload', { status: 400 })

    if (record.owner_type === 'character') {
      const { data: character, error } = await supabaseClient.from('characters').select('player, game(id,name)').eq('id', record.owner).single()
      if (error) {
        console.error('Failed to get character data', error)
        return new Response(`Edge function (Notify) error: ${error.message}`, { status: 400, headers: { 'Content-Type': 'application/json' } })
      }

      console.log('external_id', character.player)

      // Build OneSignal notification object
      const notification = new OneSignal.Notification()
      notification.app_id = Deno.env.get('ONESIGNAL_APP_ID')
      notification.name = `${character.game.name}: Nový příspěvek` // internal
      notification.contents = { en: `${character.game.name}: Nový příspěvek` }
      // notification.include_external_user_ids = [character.player] // without this the API returns 'bad request', no idea why

      const onesignalApiRes = await oneSignalClient.createNotification(notification)
      console.log('onesignalApiRes response', JSON.stringify(onesignalApiRes, null, 2))
      return new Response(JSON.stringify({ onesignalResponse: onesignalApiRes }), { headers: { 'Content-Type': 'application/json' } })
    }
  } catch (err) {
    console.error('Failed to send notification', err)
    return new Response('Server error', { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})
