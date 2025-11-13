import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SESClient, SendEmailCommand } from 'npm:@aws-sdk/client-ses';

function handleError(error) {
  console.error(error);
  return new Response(`Edge function (Migration) error: ${error.message}`, {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

const sesClient = new SESClient({ region: 'eu-north-1' });
const sourceEmail = 'info@andor2.cz';
const replyToEmail = sourceEmail;
const version = '1.0.1';
console.log(`Migration function version ${version} starting up`);

Deno.serve(async (req)=>{
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      global: {
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        }
      }
    });

    // Fetch the first unnotified user from old_users table
    const { data: oldUser, error: oldUserError } = await supabase
      .from('old_users')
      .select('id, old_email')
      .eq('notified', false)
      .limit(1)
      .maybeSingle();

    if (oldUserError) {
      return handleError(oldUserError);
    }

    if (!oldUser) {
      return new Response(JSON.stringify({
        message: 'No unnotified users found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!oldUser.old_email) {
      // Mark as notified even if no email address
      await supabase.from('old_users').update({ notified: true }).eq('id', oldUser.id);

      return new Response(JSON.stringify({
        message: 'User has no email address, marked as notified'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const subject = 'Andor2 - Informace o pokračování projektu';
    const htmlBody = `<!DOCTYPE html>
<html lang="cs" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>Andor2 Informace</title>
    <style type="text/css">
      /* Reset and base styles */
      body, table, td { margin: 0; padding: 0; border-collapse: collapse; }
      body { font-family: 'Merriweather', serif; background-color: #201c1b; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      a { color: inherit; text-decoration: none; }
      /* Media queries for mobile */
      @media all and (max-width: 639px) {
        .wrapper { width: 100% !important; }
        .container { width: 100% !important; min-width: 100% !important; padding: 0 !important; }
        .row { padding-left: 20px !important; padding-right: 20px !important; }
        .col { display: block !important; width: 100% !important; }
        .mobile-center { text-align: center !important; }
        .img { width: 100% !important; height: auto !important; }
        .ml-btn { width: 100% !important; max-width: 100% !important; }
        *[class="mobileOff"] { display: none !important; }
        *[class*="mobileOn"] { display: block !important; max-height: none !important; }
      }
    </style>
    <style type="text/css">
      @import url("https://assets.mlcdn.com/fonts-v2.css?version=1715603");
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #201c1b;">
    <div style="background-color: #201c1b; font-size: 16px; line-height: 100%;">
      <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" valign="top">
            <table class="container" width="640" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 640px;">
              <tr>
                <td>
                  <!-- Header Image -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="line-height: 0;"><img src="https://bucket.mailersendapp.com/neqvygmrw5l0p7w2/351ndgwq1mdgzqx8/images/9c197036-e74a-4704-8c8d-33a4ee231c78.jpg" width="640" class="img" style="display: block;" alt="Andor2 Header"></td>
                    </tr>
                  </table>
                  <!-- Welcome Section -->
                  <table width="100%" bgcolor="#33302f" border="0" cellpadding="0" cellspacing="0" style="color: #c4b6ab;">
                    <tr>
                      <td height="40"></td>
                    </tr>
                    <tr>
                      <td class="row" style="padding: 0 50px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="left">
                              <h1 style="font-family: 'Merriweather', serif; color: #c4b6ab; font-size: 24px; line-height: 125%; font-weight: bold; margin-bottom: 20px; text-align: center;">Vážení Andořané,</h1>
                              <p style="font-family: 'Merriweather', serif; color: #c4b6ab; font-size: 16px; line-height: 165%; margin: 0 0 15px 0;">obracíme se na Vás, abychom Vás informovali, že projekt pokračuje na nové doméně <a href="https://www.andor2.cz" target="_blank" style="color: #a5a664;">Andor2.cz</a>.</p>
                              <p style="font-family: 'Merriweather', serif; color: #c4b6ab; font-size: 16px; line-height: 165%; margin: 0 0 15px 0;">Nová verze webu přináší další funkce a stále na jejím rozvoji aktivně pracujeme.</p>
                              <p style="font-family: 'Merriweather', serif; color: #c4b6ab; font-size: 16px; line-height: 165%; margin: 0 0 15px 0;">Tento e-mail slouží pouze jako informační oznámení, další zprávy nebudou zasílány.</p>
                              <p style="font-family: 'Merriweather', serif; color: #c4b6ab; font-size: 16px; line-height: 165%; margin: 0;">Děkujeme za Vaši dřívější účast a doufáme že se opět shledáme na novém webu.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="40"></td>
                    </tr>
                  </table>
                  <!-- Footer -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td height="30"></td>
                    </tr>
                    <tr>
                      <td class="row" style="padding: 0 50px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="color: #c8c8c8; text-align: center;">
                              <a href="https://www.andor2.cz" target="_blank" style="color: #a5a664;">Andor2.cz</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="20"></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;

    const textBody = `Vážení Andořané,

obracíme se na Vás, abychom Vás informovali, že projekt pokračuje na nové doméně Andor2.cz.

Nová verze webu přináší další funkce a stále na jejím rozvoji aktivně pracujeme.

Tento e-mail slouží pouze jako informační oznámení, další zprávy nebudou zasílány.

Děkujeme za Vaši dřívější účast a doufáme že se opět shledáme na novém webu.

Andor2.cz: https://www.andor2.cz`;

    const sendCommand = new SendEmailCommand({
      Source: sourceEmail,
      Destination: {
        ToAddresses: [oldUser.old_email]
      },
      ReplyToAddresses: [
        replyToEmail
      ],
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8'
          }
        }
      }
    });

    const sendResult = await sesClient.send(sendCommand);

    // Mark user as notified
    const { error: updateError } = await supabase.from('old_users').update({ notified: true }).eq('id', oldUser.id);
    if (updateError) {
      console.error('Failed to mark user as notified:', updateError);
    }

    return new Response(JSON.stringify({
      message: 'Migration email sent successfully',
      email: oldUser.old_email
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return handleError(err);
  }
});
