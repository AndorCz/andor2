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
    console.log('Version 0.2.1')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SERVICE_KEY')}` } }
    })

    const record = req.body ? (await req.json()).record : new Response('No JSON payload', { status: 400 })

    // Fetch character and related game info
    const { data: character, error: characterError } = await supabase.from('characters').select('player, game(id, name)').eq('id', record.owner).single()
    if (characterError) { return handleError(characterError) }

    // Fetch all notification data
    const { data: notificationData, error: notificationError } = await supabase.rpc('get_notification_data', { post_id: record.id })
    if (notificationError) { return handleError(notificationError) }

    if (notificationData.length > 0) {
      notificationData.forEach(async (user) => {
        if (user.email) {
          // Send email
          if (user.email_address) {
            const emailParams = new EmailParams()
              .setFrom(sender)
              .setTo([new Recipient(user.email_address, user.name)])
              .setSubject(`${character.game.name}: Nový příspěvek ve hře`)
              .setHtml(`<p>Ve hře ${character.game.name} je nový příspěvek. <a href='https://andor2.cz/game/${character.game.id}?tab=game&tool=post'>Otevřít hru</a></p>`)

            await mailer.email.send(emailParams)
          } else {
            console.log('No email address found for user:', user.name)
          }
        }
        if (user.notification) {
          // Placeholder for sending internal notifications
          console.log('Sending notification to:', user.name)
          // Implement notification logic here
        }
      });
      return new Response(JSON.stringify({ message: 'Notifications processed' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else {
      console.log('No users to notify')
      return new Response('No users to notify', { status: 404, headers: { 'Content-Type': 'application/json' } })
    }
  } catch (err) {
    return handleError(err)
  }
})
