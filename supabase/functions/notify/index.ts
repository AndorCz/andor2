import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// import { MessageClient } from 'npm:cloudmailin' // alternative for larger volume
import { MailerSend, EmailParams, Sender, Recipient } from 'npm:mailersend'

function handleError (error: Error) {
  console.error(error)
  return new Response(`Edge function (Notify) error: ${error.message}`, { status: 400, headers: { 'Content-Type': 'application/json' } })
}

const mailer = new MailerSend({ apiKey: Deno.env.get('MAILER_KEY') })
const sender = new Sender('info@andor2.cz', 'Andor2.cz')

Deno.serve(async (req: Request) => {
  try {
    console.log('Version 0.1.4')
    // console.log('Auth', req.headers.get('Authorization')) // not getting auth header, have to use service_key :(
    // const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization')! } } })
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SERVICE_KEY')}` } }
    })

    const record = req.body ? (await req.json()).record : new Response('No JSON payload', { status: 400 })

    if (record.owner_type === 'character') {
      const { data: character, error: characterError } = await supabase.from('characters').select('player, game(id,name)').eq('id', record.owner).single()
      if (characterError) { return handleError(characterError) }

      const { data: subscription, error: subscriptionError } = await supabase.from('subscriptions').select('user_id(id,name), game, notification, email').match({ user_id: character.player, game: character.game.id }).maybeSingle()
      if (subscriptionError) { return handleError(subscriptionError) }

      if (subscription) {
        if (subscription.email) {
          // Send email
          const { data: user, error: userError } = await supabase.auth.admin.getUserById(character.player)
          if (userError) { return handleError(userError) }
  
          if (user.user.email && subscription.user_id.name) {
            const emailParams = new EmailParams()
              .setFrom(sender)
              .setTo([ new Recipient(user.user.email, subscription.user_id.name) ])
              .setSubject(`${character.game.name}: Nový příspěvek ve hře`)
              .setHtml(`<p>Ve hře je nový příspěvek. <a href='https://andor2.cz/game/${character.game.id}?tab=game&tool=post'>Otevřít hru ${character.game.name}</a></p>`)

            await mailer.email.send(emailParams)
          } else {
            return new Response('No email or name found', { status: 404, headers: { 'Content-Type': 'application/json' } })
          }
        }
        if (subscription.notification) {
          // Send notification
          console.log('2DO: send notification')
        }
        return new Response(JSON.stringify({ character, subscription }), { headers: { 'Content-Type': 'application/json' } })
      } else {
        console.log('No subscription found')
        return new Response('No subscription found', { status: 404, headers: { 'Content-Type': 'application/json' } })
      }
    }
  } catch (err) { return handleError(err) }
})
