// verify recaptcha token
// not needed anymore, using turnstile instead
export const GET = async ({ url, request, locals }) => {
  const token = url.searchParams.get('token')
  const secret = import.meta.env.RECAPTCHA_SECRET
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: `secret=${secret}&response=${token}`
  })
  const data = await response.json()
  return new Response(JSON.stringify(data), { status: data.status })
}
