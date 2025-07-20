import Replicate from 'replicate'
import { Buffer } from 'node:buffer'
import { imageSizes } from '@lib/solo/solo'
import { cropImageBackEnd } from '@lib/solo/server-utils'

const useModel = 'imagen4'
const models = {
  imagen4: { aspect: { header: '16:9', scene: '16:9', item: '9:16', npc: '9:16' }, extras: { safety_filter_level: 'block_only_high' }, id: 'google/imagen-4-fast' },
  sanaSprint: { extras: { guidance_scale: 8 }, id: 'nvidia/sana-sprint-1.6b:6ed1ce77cdc8db65550e76d5ab82556d0cb31ac8ab3c4947b168a0bda7b962e4' }
}

export async function generateImage (env, prompt, imageType) {
  console.log(`Generating '${imageType}' with prompt:`, prompt)
  if (!prompt) { return { error: { message: 'Chybí prompt pro generování obrázku' } } }
  try {
    // configure the model
    const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN })
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 50000) // 50 second timeout
    const model = models[useModel]

    // run the model
    const output = await replicate.run(model.id, {
      input: { prompt, aspect_ratio: model.aspect[imageType] || '1:1' }
    })
    const url = output.url()
    if (!url) { throw new Error('Nevygenerován žádný obrázek') }
    clearTimeout(timeoutId)

    // download resulting image
    const imageResponse = await fetch(url)
    if (!imageResponse.ok) { throw new Error(`Chyba při stahování obrázku, status: ${imageResponse.status}`) }
    const imageBlob = await imageResponse.blob()
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())

    // crop to exact size
    const width = imageSizes[imageType].width
    const height = imageSizes[imageType].height
    const { data, error } = await cropImageBackEnd(imageBuffer, width, height)
    return { data, error }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Image generation timed out')
      return { error: { message: 'Generování obrázku vypršel čas (120s)' } }
    }
    console.error('Error generating image:', error)
    return { error: { message: 'Chyba při generování obrázku: ' + error.message } }
  }
}
