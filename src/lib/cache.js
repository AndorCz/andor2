import { handleError } from '@lib/database'

const cache = new Map()

// return data from in-memory cache or run callback (and update expiry)
export async function getData (key, ttl = 300, supabaseCallback) {
  if (cache.has(key)) {
    const { value, expiry } = cache.get(key)
    if (Date.now() < expiry) {
      return value
    }
  }
  const { data, error } = await supabaseCallback()
  if (error) {
    handleError(error)
    return []
  }
  cache.set(key, { value: data, expiry: Date.now() + ttl * 1000 })
  return data
}

export function updateCache (key, value, ttl = 300) {
  cache.set(key, { value, expiry: Date.now() + ttl * 1000 })
}

export function invalidateCache (key) {
  cache.delete(key)
}
