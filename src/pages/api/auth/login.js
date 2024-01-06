import { getSupabase } from '@lib/database'

export const GET = async ({ request, redirect }) => {
  return new Response('Login selhal', { status: 400 })
}

export const POST = async ({ cookies, request, redirect }) => {
  const formData = await request.formData()
  const provider = formData.get('provider')?.toString()

  if (provider) {
    const supabase = getSupabase(cookies)

    const { data, error } = await supabase.auth.signInWithOAuth({
      options: { redirectTo: new URL(request.url).origin + '/api/auth/callback' },
      provider
    })
    if (error) { return new Response(error.message, { status: 500 }) }
    return redirect(data.url)
  } else {
    return new Response('No provider', { status: 500 })
  }
}
