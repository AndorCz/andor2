import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

function handleError (error: Error) {
  console.error(error)
  return new Response(`Edge function (Notify) error: ${error.message}`, { status: 400, headers: { 'Content-Type': 'application/json' } })
}

const smtpHost = 'email-smtp.eu-north-1.amazonaws.com'
const smtpUsername = Deno.env.get('SES_SMTP_USERNAME')
const smtpPassword = Deno.env.get('SES_SMTP_PASSWORD')

if (!smtpUsername || !smtpPassword) {
  throw new Error('Missing SES SMTP credentials (SES_SMTP_USERNAME/SES_SMTP_PASSWORD)')
}

const sourceEmail = 'info@andor2.cz'
const sourceName = 'Andor2.cz'
const fromAddress = `${sourceName} <${sourceEmail}>`
const replyToEmail = sourceEmail

Deno.serve(async (req: Request) => {
  try {
    console.log('Notify fired, version 0.3.6')
    const supabase = createClient(
      Deno.env.get('PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('PUBLIC_SERVICE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SERVICE_KEY')}` } }
    })

    const payload = await req.json()
    const record = payload?.record
    if (!record) { return new Response('No record payload', { status: 400, headers: { 'Content-Type': 'application/json' } }) }
    if (record.owner_type !== 'character') {
      console.log('Skipping notifications for owner type:', record.owner_type)
      return new Response(JSON.stringify({ message: 'No notifications required' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    // Fetch character and related game info
    const { data: character, error: characterError } = await supabase.from('characters').select('id, name, player, game(id, name), portrait').eq('id', record.owner).maybeSingle()
    if (characterError) { return handleError(characterError) }
    if (!character) {
      console.log('Character not found for owner:', record.owner)
      return new Response(JSON.stringify({ message: 'Character missing, notifications skipped' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    // Fetch all notification data
    const { data: notificationData, error: notificationError } = await supabase.rpc('get_notification_data', { post_id: record.id })
    if (notificationError) { return handleError(notificationError) }
    console.log('Notification data', notificationData)

    const emailList: string[] = []
    const portrait = character.portrait ? `<td style='padding-right: 10px' valign='top'><img src='https://zwclrcefxleqmzhhfcte.supabase.co/storage/v1/object/public/portraits/${character.id}.jpg?hash=${character.portrait}' style='width: 100px' /></td>` : ''

    if (notificationData.length > 0) {
      for (const user of notificationData) {
        if (user.email) { // Email enabled
          if (user.email_address) {
            emailList.push(user.email_address)
          } else {
            console.log('No email address found for user:', user.name)
          }
        }
        if (user.notification) { // Notification enabled
          // Placeholder for sending internal notifications
          console.log('Sending notification to:', user.name)
          // Implement notification logic here
        }
      }
      if (emailList.length > 0) { // Send email to all users
        const subject = `${character.game.name}: Nový příspěvek ve hře`
        const htmlBody = `<div style='background-color: #2b2827; color: #c4b6ab; padding: 20px' bgcolor='#2b2827'>
            <table>
              <tr>
                ${portrait}
                <td style='color: #c4b6ab; background-color: #33302f' bgcolor='#33302f'>
                  <div style='padding: 5px 15px; border-bottom: 1px #2b2827 solid'>
                    <span style='font-size: 16px; color: #968ebd; font-weight: bold;'>${character.name}</span>
                    ${record.audience ? ' (soukromý příspěvek)' : ''}
                  </div>
                  <div style='padding: 15px; font-size: 16px'>${record.content}</div>
                </td>
              </tr>
            </table>
            <p>
              <a href='https://andor2.cz/game/${character.game.id}?tab=game&tool=post' style='display: block; width: 150px; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px; text-align: center; color: #c4b6ab; background-color: #634b41; text-decoration: none; margin: auto;'>Otevřít hru</a>
            </p>
          </div>`
        const textBody = `${character.name}${record.audience ? ' (soukromý příspěvek)' : ''}\n\n${record.content}\n\nOtevřít hru: https://andor2.cz/game/${character.game.id}?tab=game&tool=post`

        const client = new SmtpClient()
        try {
          await client.connectTLS({
            hostname: smtpHost,
            port: 465,
            username: smtpUsername,
            password: smtpPassword
          })

          await client.send({
            from: fromAddress,
            to: emailList,
            subject,
            content: textBody,
            html: htmlBody,
            headers: { 'Reply-To': replyToEmail }
          })

          console.log(`SES SMTP message sent to ${emailList.length} recipient(s)`)
        } finally {
          try {
            await client.close()
          } catch (closeError) {
            console.error('Failed to close SMTP client', closeError)
          }
        }
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
