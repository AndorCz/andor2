
import { invalidateCache } from '@lib/cache'

export const GET = async ({ url }) => {
  const { type } = Object.fromEntries(url.searchParams)
  invalidateCache(type)
  return new Response('Cache invalidated', { status: 200 })
}
