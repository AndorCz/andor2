import { getSupabase } from '@lib/database-server'

export const GET = async () => {
  return new Response('Login selhal', { status: 400 })
}

export const POST = async ({ cookies, request, redirect, context }) => {
  const formData = await request.formData()
  const provider = formData.get('provider')?.toString()

  if (provider) {
    const env = import.meta.env ? import.meta.env : context.locals.runtime.env
    const supabase = getSupabase(cookies, env)

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
