
export function saveAuthCookies (cookies, { access_token, refresh_token }) {
  const maxAge = 100 * 1000 * 60 * 60 * 24 * 365 // 100 years
  const secure = import.meta.env.NODE_ENV === 'production' // disable 'secure' flag in development, Safari refuses to set a 'secure' cookie
  cookies.set('sb-access-token', access_token, { sameSite: 'lax', path: '/', secure, maxAge })
  cookies.set('sb-refresh-token', refresh_token, { sameSite: 'lax', path: '/', secure, maxAge })
}

export function clone (source) { return source ? JSON.parse(JSON.stringify(source)) : source }

export function resizePortrait (img, width, height) {
  const { width: imgWidth, height: imgHeight } = img
  const imgRatio = imgWidth / imgHeight
  const desiredRatio = width / height
  const newWidth = imgRatio > desiredRatio ? height * imgRatio : width
  const newHeight = imgRatio > desiredRatio ? height : width / imgRatio
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = newWidth
  canvas.height = newHeight
  ctx.drawImage(img, 0, 0, newWidth, newHeight)
  const cropCanvas = document.createElement('canvas')
  const cropCtx = cropCanvas.getContext('2d')
  cropCanvas.width = width
  cropCanvas.height = height
  const startX = Math.max(0, (newWidth - width) / 2)
  const startY = 0
  cropCtx.drawImage(canvas, startX, startY, width, height, 0, 0, width, height)
  return cropCanvas.toDataURL()
}
