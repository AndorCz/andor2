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

// crops side of the image by a given ratio, centered horizontally
export function cropPortrait (img, ratio) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const { width, height } = img
  const newWidth = Math.round(width * ratio)
  const x = Math.round((width - newWidth) / 2)
  canvas.width = newWidth
  canvas.height = height
  ctx.drawImage(img, x, 0, newWidth, height, 0, 0, newWidth, height)
  return canvas
}

export function resizePortrait (img, newWidth, newHeight, mimeType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = newWidth
    canvas.height = newHeight
    ctx.drawImage(img, 0, 0, newWidth, newHeight)
    canvas.toBlob(blob => {
      blob ? resolve({ blob, base64: canvas.toDataURL(mimeType) }) : reject(new Error('Konverze canvasu do blobu selhala'))
    }, mimeType)
  })
}

export function resizeImage (img, maxWidth, maxHeight, mimeType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
    canvas.width = img.width * ratio
    canvas.height = img.height * ratio
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Conversion failed')), mimeType)
  })
}

export function previewCanvas (canvas) {
  document.body.appendChild(canvas)
}

export function previewImage (image) {
  document.body.appendChild(image)
}

export function formatDate (time) {
  const dt = DateTime.fromISO(time)
  // return dt.setLocale('cs').toRelativeCalendar() + ', ' + dt.toLocaleString(DateTime.TIME_SIMPLE)
  return dt.setLocale('cs').toLocaleString(DateTime.DATE_FULL) + ', ' + dt.toLocaleString(DateTime.TIME_SIMPLE)
}

export function debounce (callback, wait) {
  let timerId
  return (...args) => {
    clearTimeout(timerId)
    timerId = setTimeout(() => { callback(...args) }, wait)
  }
}

export function throttle (callback, limit) {
  let waiting = false
  return function () {
    if (!waiting) {
      callback.apply(this, arguments)
      waiting = true
      setTimeout(function () { waiting = false }, limit)
    }
  }
}

export function getImage (image) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { resolve(img) }
    img.onerror = () => reject(new Error('Obrázek se nepodařilo přečíst'))
    img.crossOrigin = 'anonymous'
    let src
    if (image instanceof File) { // support File
      src = URL.createObjectURL(image)
    } else if (image instanceof Blob) { // support Blob
      src = URL.createObjectURL(image)
    } else if (typeof image === 'string') { // support URL/Base64
      src = image
    } else {
      reject(new Error('Neznámý typ obrázku'))
    }
    img.src = src
  })
}

export function cropImageToBlob (imageElement, crop, outputSize) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = outputSize.width
    canvas.height = outputSize.height
    ctx.drawImage(imageElement, crop.pixels.x, crop.pixels.y, crop.pixels.width, crop.pixels.height, 0, 0, outputSize.width, outputSize.height)
    canvas.toBlob(blob => { blob ? resolve(blob) : reject(new Error('Konverze canvasu do blobu selhala')) }, 'image/jpeg')
  })
}

export function base64ToBlob (base64, contentType = 'image/jpeg', sliceSize = 512) {
  const base64Data = base64.includes('base64,') ? base64.split('base64,')[1] : base64
  const byteCharacters = atob(base64Data)
  const byteArrays = []
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }
  return new Blob(byteArrays, { type: contentType })
}

export function createSlug (name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
}

export function addURLParam (param, value) {
  const urlParams = new URLSearchParams(window.location.search)
  urlParams.set(param, value)
  window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
}

export function removeURLParam (param) {
  const urlParams = new URLSearchParams(window.location.search)
  urlParams.delete(param)
  window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`)
}

export function updateURLParam (key, value) {
  const url = new URL(window.location)
  url.searchParams.set(key, value)
  window.history.pushState({}, '', url)
}

export function redirectWithToast ({ url, toastType, toastText }) {
  const currentUrl = new URL(url || window.location.href)
  const searchParams = currentUrl.searchParams
  searchParams.set('toastType', toastType || 'success')
  searchParams.set('toastText', toastText || 'Operace proběhla úspěšně')
  currentUrl.search = searchParams.toString()
  window.location.href = currentUrl.href
}

function hashCode (str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

export function stringToColor (str) {
  return `hsl(${hashCode(str) % 360}, 50%, 80%)`
}
