import { DateTime } from 'luxon'

export function getHash () {
  return Math.random().toString(36).slice(-5)
}

export function getImageUrl (supabase, path, bucket) {
  const { data, error } = supabase.storage.from(bucket).getPublicUrl(path)
  if (error) { throw error }
  return data.publicUrl
}

export async function uploadPortrait (supabase, identityId, table, file) {
  const { error: error1 } = await supabase.storage.from('portraits').upload(identityId + '.jpg', file, { upsert: true })
  if (error1) { return Promise.reject(error1) }
  const { error: error2 } = await supabase.from(table).update({ portrait: getHash() }).eq('id', identityId)
  if (error2) { return Promise.reject(error2) }
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

export function resizePortrait (img, newWidth, newHeight, mimeType = 'image/png') {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = newWidth
    canvas.height = newHeight
    ctx.clearRect(0, 0, newWidth, newHeight)
    ctx.drawImage(img, 0, 0, newWidth, newHeight)
    canvas.toBlob(blob => {
      if (blob) { // Convert canvas to base64
        const reader = new FileReader()
        reader.onloadend = () => { resolve({ blob, base64: reader.result }) }
        reader.readAsDataURL(blob)
      } else {
        reject(new Error('Canvas conversion failed'))
      }
    }, mimeType)
  })
}

export function getBase64 (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Chyba při čtení souboru'))
    reader.readAsDataURL(file)
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
  const url = new URL(window.location)
  url.searchParams.set(param, value)
  window.history.pushState({}, '', `${window.location.pathname}?${url.searchParams.toString()}`)
  return url.toString()
}

export function updateURLParam (key, value, replace = false) {
  const url = new URL(window.location)
  url.searchParams.set(key, value)
  replace ? window.history.replaceState({}, '', url) : window.history.pushState({}, '', url)
  return url.toString()
}

export function removeURLParam (param) {
  const urlParams = new URLSearchParams(window.location.search)
  urlParams.delete(param)
  window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`)
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

export function addCharacterNameStyles (characters) {
  // add style with character.color as color for every class named after a character id
  const nameStyles = document.createElement('style')
  nameStyles.id = 'nameStyles'
  characters.forEach(char => { if (char.color) { nameStyles.textContent += `.char_${char.id} { color: ${char.color}; } ` } })
  document.head.appendChild(nameStyles)
}

export function getHex (color) {
  if (typeof color === 'string') {
    if (color[0] === '#') { return color }
    const span = document.createElement('span')
    span.style.color = color
    document.body.appendChild(span)
    const hex = window.getComputedStyle(span).color.replace(/[^\d,]/g, '').split(',').map(c => parseInt(c).toString(16).padStart(2, '0')).join('')
    document.body.removeChild(span)
    return '#' + hex
  }
}

export async function waitForMediaLoad (container) {
  if (!container) return
  const images = container.querySelectorAll('img')
  const videos = container.querySelectorAll('video')
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve()
    return new Promise(resolve => {
      img.onload = resolve
      img.onerror = resolve
    })
  })
  promises.push(...Array.from(videos).map(video => {
    if (video.readyState >= 2) return Promise.resolve()
    return new Promise(resolve => {
      video.onloadeddata = resolve
      video.onerror = resolve
    })
  }))
  await Promise.all(promises)
}
