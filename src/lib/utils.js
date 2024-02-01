
import { DateTime } from 'luxon'

// eslint-disable-next-line camelcase
export function saveAuthCookies (cookies, { access_token, refresh_token }) {
  const maxAge = 100 * 1000 * 60 * 60 * 24 * 365 // 100 years
  const secure = import.meta.env.NODE_ENV === 'production' // disable 'secure' flag in development, Safari refuses to set a 'secure' cookie
  cookies.set('sb-access-token', access_token, { path: '/', secure, maxAge })
  cookies.set('sb-refresh-token', refresh_token, { path: '/', secure, maxAge })
}

export function clone (source) { return source ? JSON.parse(JSON.stringify(source)) : source }

export function isFilledArray (array) { return Array.isArray(array) && array.length }

export function resizePortrait (img, width, maxHeight) {
  const { width: imgWidth, height: imgHeight } = img
  const imgRatio = imgWidth / imgHeight
  // Calculate new dimensions
  let newWidth = width
  let newHeight = newWidth / imgRatio
  if (newHeight > maxHeight) {
    // Adjust dimensions to respect maxHeight while maintaining aspect ratio
    newHeight = maxHeight
    newWidth = newHeight * imgRatio
  }
  // Draw the resized image on a canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = newWidth
  canvas.height = newHeight
  ctx.drawImage(img, 0, 0, newWidth, newHeight)
  return { base64: canvas.toDataURL(), height: newHeight }
}

export function loadBase64Image (base64String) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = 'data:image/png;base64,' + base64String
  })
}

export function getImage (file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { resolve(img) }
    img.onerror = () => reject(new Error('Obrázek se nepodařilo přečíst'))
    img.src = URL.createObjectURL(file)
  })
}

export function formatDate (time) {
  const dt = DateTime.fromISO(time)
  // return dt.setLocale('cs').toLocaleString(DateTime.DATETIME_MED)
  return dt.setLocale('cs').toRelativeCalendar() + ', ' + dt.toLocaleString(DateTime.TIME_SIMPLE)
}

export function debounce (callback, wait) {
  let timerId
  return (...args) => {
    clearTimeout(timerId)
    // eslint-disable-next-line n/no-callback-literal
    timerId = setTimeout(() => { callback(...args) }, wait)
  }
}
