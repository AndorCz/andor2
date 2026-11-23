import Replicate from 'replicate'
import { cropImageBackEnd } from '@lib/solo/server-utils'

const defaultModel = 'nanoBanana2Lite'
const models = {
  nanoBanana2Lite: { aspect: { header: '16:9', scene: '16:9', item: '9:16', character: '9:16', map: '1:1' }, id: 'google/nano-banana-2-lite' },
  imagen4: { aspect: { header: '16:9', scene: '16:9', item: '9:16', character: '9:16', map: '1:1' }, extras: { safety_filter_level: 'block_only_high' }, id: 'google/imagen-4' },
  sanaSprint: { extras: { guidance_scale: 8 }, id: 'nvidia/sana-sprint-1.6b:6ed1ce77cdc8db65550e76d5ab82556d0cb31ac8ab3c4947b168a0bda7b962e4' }
}

export const imageSizes = {
  header: { width: 1100, height: 226 },
  scene: { width: 1408, height: 768 },
  item: { width: 200, height: 400 },
  character: { width: 200, height: 400 },
  map: { width: 1024, height: 1024 }
}

function getErrorMessage (error) {
  if (!error) return 'Neznámá chyba'
  if (typeof error === 'string') return error
  return error.message || JSON.stringify(error)
}

export async function generateImage (env, prompt, imageType, useModel = defaultModel) {
  console.log(`Generating '${imageType}' with prompt:`, prompt)
  if (!prompt) { return { error: { message: 'Chybí prompt pro generování obrázku' } } }
  const abortController = new AbortController()
  const { signal } = abortController
  const timeoutId = setTimeout(() => abortController.abort(), 50000)
  try {
    const model = models[useModel]
    if (!model) { throw new Error(`Neznámý model pro generování obrázku: ${useModel}`) }

    const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN, useFileOutput: false, fetch: (url, options) => fetch(url, { ...options, signal }) })
    const output = await replicate.run(model.id, {
      // Replicate 1.4 can return an unfinished prediction in block mode.
      wait: { mode: 'poll' },
      signal,
      input: { prompt, aspect_ratio: model.aspect?.[imageType] || '1:1', output_format: 'jpg' }
    })
    const url = Array.isArray(output) ? output[0] : output
    if (typeof url !== 'string' || !/^(https:\/\/|data:image\/)/i.test(url)) {
      const outputType = Array.isArray(output) ? `array(${output.length})` : url === null ? 'null' : typeof url
      throw new Error(`Model ${model.id} nevrátil obrázek (typ výstupu: ${outputType})`)
    }

    const imageResponse = await fetch(url, { signal })
    if (!imageResponse.ok) { throw new Error(`Chyba při stahování obrázku, status: ${imageResponse.status}`) }
    const imageBuffer = await imageResponse.arrayBuffer()

    // crop to exact size
    const width = imageSizes[imageType].width
    const height = imageSizes[imageType].height
    const { data, error } = await cropImageBackEnd(imageBuffer, width, height)
    return error ? { error: { message: getErrorMessage(error) } } : { data }
  } catch (error) {
    if (signal.aborted) {
      console.error('Image generation timed out')
      return { error: { message: 'Vypršel čas na generování obrázku (50 s)' } }
    }
    console.error('Error generating image:', error)
    return { error: { message: 'Chyba při generování obrázku: ' + getErrorMessage(error) } }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function generatePortrait (env, appearance) {
  return await generateImage(env, `Digital painting, RPG character in full-length and background environment (no text, no interface, only the character): ${appearance}`, 'character')
}

export async function generateMap (env, description) {
  return await generateImage(env, `D&D RPG map, digital painting, top-down view, dark background, tiled with square grid: ${description}`, 'map', 'imagen4')
}
