import { Buffer } from 'node:buffer'
import { cropImageBackEnd } from '@lib/solo/server-utils'

export const imageSizes = {
  header: { width: 1100, height: 226 },
  scene: { width: 1408, height: 768 },
  item: { width: 200, height: 400 },
  npc: { width: 200, height: 400 }
}

export async function generateImage (env, prompt, imageType) {
  if (!prompt) { return { error: { message: 'Chybí prompt pro generování obrázku' } } }
  try {
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 50000) // 50 second timeout

    const sizes = imageSizes[imageType]
    const width = sizes.width
    const height = sizes.height
    // flux uses 64x64 tiles
    // width = Math.ceil(width / 64) * 64
    // height = Math.ceil(height / 64) * 64

    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.AIML_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: 'bytedance/seedream-3.0', // 'flux/schnell', 'flux/dev'
        guidance_scale: 8, // seedream
        size: `${width}x${height}` // seedream
        // image_size: { width: imageSizes.generation.width, height: imageSizes.generation.height } // flux
      }),
      signal: abortController.signal
    })

    clearTimeout(timeoutId)
    if (!response.ok) { throw new Error(`Nevygenerován žádný obrázek, status: ${response.status}`) }
    const generation = await response.json()
    // download resulting image
    const url = generation.images[0].url
    const imageResponse = await fetch(url)
    if (!imageResponse.ok) { throw new Error(`Chyba při stahování obrázku, status: ${imageResponse.status}`) }
    const imageBlob = await imageResponse.blob()
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())
    // crop to exact size
    if (width !== sizes.width || height !== sizes.height) {
      const { data, error } = await cropImageBackEnd(imageBuffer, sizes.width, sizes.height)
      return { data, error }
    } else {
      return { data: imageBuffer }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Image generation timed out')
      return { error: { message: 'Generování obrázku vypršel čas (120s)' } }
    }
    console.error('Error generating image:', error)
    return { error: { message: 'Chyba při generování obrázku: ' + error.message } }
  }
}
