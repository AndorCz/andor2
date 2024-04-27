import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function handleError (error: Error) {
  console.error(error)
  return new Response(`Edge function (Notify) error: ${error.message}`, { status: 400, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })
    const record = req.body ? (await req.json()).record : new Response('No JSON payload', { status: 400 })

    if (record.owner_type === 'character') {
      const { data: character, error: characterError } = await supabaseClient.from('characters').select('player, game(id,name)').eq('id', record.owner).single()
      if (characterError) { return handleError(characterError) }
      console.log('character', character)

      const { data: subscription, error: subscriptionError } = await supabaseClient.from('subscriptions').select('*').eq('user_id', character.player).single()
      if (subscriptionError) { return handleError(subscriptionError) }
      console.log('subscription', subscription)

      if (subscription.email) { // Send email
        console.log('2DO: send email')
      }

      if (subscription.notification) { // Send notification
        console.log('2DO: send notification')
      }

      return new Response(JSON.stringify({ character, subscription }), { headers: { 'Content-Type': 'application/json' } })
    }
  } catch (err) { return handleError(err) }
})
