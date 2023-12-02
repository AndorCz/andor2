
export function saveAuthCookies (cookies, { access_token, refresh_token }) {
  const maxAge = 100 * 1000 * 60 * 60 * 24 * 365 // 100 years
  const secure = import.meta.env.NODE_ENV === 'production' // disable 'secure' flag in development, Safari refuses to set a 'secure' cookie
  cookies.set('sb-access-token', access_token, { sameSite: 'lax', path: '/', secure, maxAge })
  cookies.set('sb-refresh-token', refresh_token, { sameSite: 'lax', path: '/', secure, maxAge })
}

export function clone (source) { return source ? JSON.parse(JSON.stringify(source)) : source }
