
export const GET = async ({ url, request, locals }) => {
  const { game } = Object.fromEntries(url.searchParams)

  const cookieHeader = request.headers.get('cookie')
  const response = await fetch(`${url.origin}/game/${game}/download`, {
    headers: { ...(cookieHeader ? { Cookie: cookieHeader } : {}) }
  })
  const gameHtml = await response.text()

  return new Response(gameHtml, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="zaloha-hry-${game}.html"`
    }
  })
}
