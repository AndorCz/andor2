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
    console.log('Notify fired, version 0.3.2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SERVICE_KEY')}` } }
    })

    const record = req.body ? (await req.json()).record : new Response('No JSON payload', { status: 400 })

    // Fetch character and related game info
    const { data: character, error: characterError } = await supabase.from('characters').select('id, name, player, game(id, name), portrait').eq('id', record.owner).single()
    if (characterError) { return handleError(characterError) }

    // Fetch all notification data
    const { data: notificationData, error: notificationError } = await supabase.rpc('get_notification_data', { post_id: record.id })
    if (notificationError) { return handleError(notificationError) }
    console.log('Notification data', notificationData)

    let emailList = []
    const portrait = character.portrait ? `<td style='padding-right: 10px'><img src='https://zwclrcefxleqmzhhfcte.supabase.co/storage/v1/object/public/portraits/${character.id}.jpg?hash=${character.portrait}' style='width: 100px' /></td>` : ''

    if (notificationData.length > 0) {
      notificationData.forEach(async (user) => {
        if (user.email) { // Email enabled
          if (user.email_address) {
            emailList.push(new Recipient(user.email_address, user.name || 'Beze jména'))
          } else {
            console.log('No email address found for user:', user.name)
          }
        }
        if (user.notification) { // Notification enabled
          // Placeholder for sending internal notifications
          console.log('Sending notification to:', user.name)
          // Implement notification logic here
        }
      });
      if (emailList.length > 0) { // Send email to all users
        const emailParams = new EmailParams()
          .setFrom(sender)
          .setTo(emailList)
          .setSubject(`${character.game.name}: Nový příspěvek ve hře`)
          .setHtml(`<div style='background-color: #2b2827; color: #c4b6ab; padding: 20px' bgcolor='#2b2827'>
            <table>
              <tr>
                ${portrait}
                <td style='background-color: #33302f; bgcolor='#33302f'>
                  <div style='padding: 5px 15px; color: #968ebd; font-weight: bold; border-bottom: 1px #2b2827 solid'>${character.name}</div>
                  <div style='padding: 15px; font-size: 16px'>${record.content}</div>
                </td>
              </tr>
            </table>
            <p>
              <a href='https://andor2.cz/game/${character.game.id}?tab=game&tool=post' style='display: block; width: 150px; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px; text-align: center; color: #c4b6ab; background-color: #634b41; text-decoration: none; margin: auto;'>Otevřít hru</a>
            </p>
          </div>`)
        await mailer.email.send(emailParams)
      }
      return new Response(JSON.stringify({ message: 'Notifications processed' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else {
      console.log('No users to notify')
      return new Response('No users to notify', { status: 404, headers: { 'Content-Type': 'application/json' } })
    }
  } catch (err) {
    return handleError(err)
  }
})
