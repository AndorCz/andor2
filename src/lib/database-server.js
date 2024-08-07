import { getImageUrl } from '@lib/utils'

// deprecated
// eslint-disable-next-line camelcase
export function saveAuthCookies (cookies, { access_token, refresh_token }) {
  const maxAge = 100 * 1000 * 60 * 60 * 24 * 365 // 100 years
  const environment = import.meta.env ? 'development' : 'production' // import.meta.env doesn't exist in production
  const secure = environment === 'production' // disable 'secure' flag in development, Safari refuses to set a 'secure' cookie
  cookies.set('sb-access-token', access_token, { path: '/', secure, maxAge })
  cookies.set('sb-refresh-token', refresh_token, { path: '/', secure, maxAge })
}

export function getHeaderUrl (supabase, type, id, hash) {
  return getImageUrl(supabase, `${type}-${id}.jpg?hash=${hash}`, 'headers')
}

export function getPortraitUrl (supabase, identityId, hash) {
  const path = `${identityId}.jpg${hash ? '?hash=' + hash : ''}`
  return getImageUrl(supabase, path, 'portraits')
}
