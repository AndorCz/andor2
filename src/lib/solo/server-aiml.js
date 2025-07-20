import { Buffer } from 'node:buffer'
import { imageSizes } from '@lib/solo/solo'
import { cropImageBackEnd } from '@lib/solo/server-utils'

const models = {
  'bytedance/seedream-3.0': { minWidth: 512, minHeight: 512, cellSize: 32, extras: { guidance_scale: 8 } }
}

export async function generateImage (env, prompt, imageType) {
  console.log(`Generating '${imageType}' with prompt:`, prompt)
  if (!prompt) { return { error: { message: 'Chybí prompt pro generování obrázku' } } }
  try {
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 50000) // 50 second timeout

    const model = 'bytedance/seedream-3.0' // 'flux/schnell', 'flux/dev'
    const modelInfo = models[model]
    const sizes = imageSizes[imageType]
    let width = sizes.width
    let height = sizes.height

    // adjust to minimum size while keeping width to height proportion
    if (width < modelInfo.minWidth || height < modelInfo.minHeight) {
      const aspectRatio = width / height
      if (width < modelInfo.minWidth) {
        width = modelInfo.minWidth
        height = Math.round(width / aspectRatio)
      }
      if (height < modelInfo.minHeight) {
        height = modelInfo.minHeight
        width = Math.round(height * aspectRatio)
      }
    }

    // quantize
    if (modelInfo.cellSize) {
      const cellSize = modelInfo.cellSize
      width = Math.ceil(width / cellSize) * cellSize
      height = Math.ceil(height / cellSize) * cellSize
    }

    const body = { prompt, model, ...modelInfo.extras }
    body.size = `${width}x${height}` // seedream
    // body.image_size = { width: imageSizes.generation.width, height: imageSizes.generation.height } // flux

    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.AIML_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortController.signal
    })

    clearTimeout(timeoutId)
    if (!response.ok) { throw new Error(`Nevygenerován žádný obrázek, status: ${response.status}`) }
    const generation = await response.json()
    // download resulting image
    // const url = generation.images[0].url // flux
    const url = generation.data[0].url // seedream
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
