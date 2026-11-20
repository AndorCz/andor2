import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Email = {
  to: string[]
  subject: string
  html: string
  text: string
}

const sender = 'info@andor2.cz'
const recipientLimit = 50

export async function sendEmail (supabase: SupabaseClient, email: Email, idempotencyKey: string) {
  const { data, error } = await supabase.from('resend_api_key').select('api_key').maybeSingle()
  if (error) throw new Error('Could not read the Resend API key from Vault')
  if (!data?.api_key) throw new Error('Resend API key is missing from Vault')

  const recipients = [...email.to].sort()
  for (let offset = 0; offset < recipients.length; offset += recipientLimit) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${data.api_key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${idempotencyKey}/${offset}`
      },
      body: JSON.stringify({ ...email, from: sender, reply_to: sender, to: recipients.slice(offset, offset + recipientLimit) })
    })

    await response.body?.cancel()
    if (!response.ok) throw new Error(`Resend rejected the email (${response.status})`)
  }
}
