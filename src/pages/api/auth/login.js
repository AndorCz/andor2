export const GET = async () => {
  return new Response('Login selhal', { status: 400 })
}

export const POST = async ({ locals, request, redirect }) => {
  const formData = await request.formData()
  const provider = formData.get('provider')?.toString()

  if (provider) {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      options: { redirectTo: new URL(request.url).origin + '/api/auth/callback' },
      provider
    })
    if (error) { return new Response(error.message, { status: 500 }) }
    return redirect(data.url)
  } else {
    return new Response('No provider', { status: 500 })
  }
}
