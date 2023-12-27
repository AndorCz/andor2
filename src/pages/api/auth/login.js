
import { supabase } from '@lib/database'

export const GET = async ({ request, redirect }) => {
  console.log('landed on GET request')
  return new Response('Login selhal', { status: 400 })
}

export const POST = async ({ request, redirect }) => {
  console.log('login api POST fired')

  const formData = await request.formData()
  const provider = formData.get('provider')?.toString()

  if (provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: new URL(request.url).origin + '/api/auth/callback' }
    })

    if (error) {
      return new Response(error.message, { status: 500 })
    }
    console.log('redirecting to ' + data.url)
    return redirect(data.url)
  } else {
    return new Response('No provider', { status: 500 })
  }
}
