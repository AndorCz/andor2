
export const GET = async ({ request, redirect }) => {
  return new Response('Login selhal', { status: 400 })
}

export const POST = async ({ request, redirect, locals }) => {
  const formData = await request.formData()
  const provider = formData.get('provider')?.toString()

  if (provider) {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
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
