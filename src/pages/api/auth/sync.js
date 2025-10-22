import { saveAuthCookies } from '@lib/database-server'

export const POST = async ({ request, cookies }) => {
  try {
    const { access_token: accessToken, refresh_token: refreshToken } = await request.json()
    if (!accessToken || !refreshToken) {
      return new Response('Missing tokens', { status: 400 })
    }

    saveAuthCookies(cookies, { access_token: accessToken, refresh_token: refreshToken })
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Auth sync error:', error)
    return new Response('Failed to sync session', { status: 500 })
  }
}
