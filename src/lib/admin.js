export const adminIds = [
  '2d7898ea-ac7b-4f1b-bf29-a10c28892835', // production
  '6d3c87ea-aacc-4fd6-9859-852894fd3092' // localhost
]

export function isAdmin (user) {
  return adminIds.includes(typeof user === 'string' ? user : user?.id)
}
