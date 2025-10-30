import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SESClient, SendEmailCommand } from 'npm:@aws-sdk/client-ses'

function handleError (error) {
  console.error(error)
  return new Response(`Edge function (Notify) error: ${error.message}`, { status: 400, headers: { 'Content-Type': 'application/json' } })
}

const sesClient = new SESClient({ region: 'eu-north-1' })
const sourceEmail = 'info@andor2.cz'
const replyToEmail = sourceEmail
const version = '1.0.1'

console.log(`Notify function version ${version} starting up`)

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
    )

    const payload = await req.json()
    const record = payload?.record
    if (!record) { return new Response('No record payload', { status: 400, headers: { 'Content-Type': 'application/json' } }) }
    if (record.owner_type !== 'character') { return new Response(JSON.stringify({ message: 'Owner type is not character, notifications skipped' }), { status: 200, headers: { 'Content-Type': 'application/json' } }) }

    // Fetch all notification data
    const { data: notificationData, error: notificationError } = await supabase.rpc('get_notification_data', { post_id: record.id })
    if (notificationError) { return handleError(notificationError) }
    // console.log('Notification data', notificationData)

    const emailList = []

    if (notificationData.length > 0) {

      // Fetch character and related game info
      const { data: character, error: characterError } = await supabase.from('characters').select('id, name, player, game(id, name), portrait').eq('id', record.owner).maybeSingle()
      if (characterError) { return handleError(characterError) }
      if (!character) {
        console.log('Character not found for owner:', record.owner)
        return new Response(JSON.stringify({ message: 'Character missing, notifications skipped' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      for (const user of notificationData) {
        if (user.email) { // Email enabled
          if (user.email_address) {
            emailList.push(user.email_address)
          } else {
            console.log('No email address found for user:', user.name)
          }
        }
        if (user.notification) { // Notification enabled
          // TODO: Implement notification logic here
        }
      }
      if (emailList.length > 0) { // Send email to all users
        const subject = `${character.game.name}: Nový příspěvek ve hře`
        const htmlBody = `<div style='background-color: #2b2827; color: #c4b6ab; padding: 20px' bgcolor='#2b2827'>
            <table width='100%'>
              <tr>
                <td style='padding-right: 10px; width: 100px;' valign='top'><img src=${character.portrait ? `https://zwclrcefxleqmzhhfcte.supabase.co/storage/v1/object/public/portraits/${character.id}.jpg?hash=${character.portrait}` : 'https://andor2.cz/default_char.jpg'} style='width: 100px' /></td>
                <td style='color: #c4b6ab; background-color: #33302f' bgcolor='#33302f' valign='top'>
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

        const sendCommand = new SendEmailCommand({
          Source: sourceEmail,
          Destination: {
            ToAddresses: emailList
          },
          ReplyToAddresses: [replyToEmail],
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: htmlBody, Charset: 'UTF-8' },
              Text: { Data: textBody, Charset: 'UTF-8' }
            }
          }
        })

        const sendResult = await sesClient.send(sendCommand)
      }
      return new Response(JSON.stringify({ message: 'Notifications processed' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else {
      return new Response('No users to notify', { status: 404, headers: { 'Content-Type': 'application/json' } })
    }
  } catch (err) {
    return handleError(err)
  }
})