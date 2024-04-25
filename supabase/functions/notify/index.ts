import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import * as OneSignal from 'https://esm.sh/@onesignal/node-onesignal@2.0.1-beta2'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const configuration = OneSignal.createConfiguration({
  userKey: Deno.env.get('ONESIGNAL_USER_AUTH'),
  appKey: Deno.env.get('ONESIGNAL_API_KEY')
})

const oneSignalClient = new OneSignal.DefaultApi(configuration)

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { record } = await req.json()

    console.log('record', record)

    if (record.owner_type === 'character') {
      const { data: character, error } = await supabaseClient.from('characters').select('player, game(id,name)').eq('id', record.owner).single()
      if (error) {
        console.error('Failed to get character data', error)
        return new Response('Edge function (Notify) error: ' + error.message, { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      console.log('character', character)

      // Build OneSignal notification object
      const notification = new OneSignal.Notification()
      notification.name = 'Nový příspěvek ve hře ' + character.game.name
      notification.app_id = Deno.env.get('ONESIGNAL_APP_ID')
      notification.include_external_user_ids = [character.owner]
      notification.contents = { en: `${record.name}: Nový příspěvek` }

      const onesignalApiRes = await oneSignalClient.createNotification(notification)
      return new Response(JSON.stringify({ onesignalResponse: onesignalApiRes }), { headers: { 'Content-Type': 'application/json' } })
    }
  } catch (err) {
    console.error('Failed to send notification', err)
    return new Response('Server error.', { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})
