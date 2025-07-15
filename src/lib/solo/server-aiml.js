import { Buffer } from 'node:buffer'
import { cropImageBackEnd } from '@lib/solo/server-utils'

export async function generateImage (env, prompt, imageParams) {
  if (!prompt) { return { error: { message: 'Chybí prompt pro generování obrázku' } } }
  try {
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 120000) // 120 second timeout

    console.log('Generating image with prompt:', prompt)
    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.AIML_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: 'flux/dev', // 'flux/schnell'
        image_size: { width: imageParams.generation.width, height: imageParams.generation.height }
      }),
      signal: abortController.signal
    })
    console.log('Image generation response:', response.status, response.statusText)

    clearTimeout(timeoutId)
    if (!response.ok) {
      clearTimeout(timeoutId)
      const generationErrorText = await response.text()
      console.error('Image generation failed:', response.status, response.statusText, generationErrorText)
      throw new Error(`Nevygenerován žádný obrázek, status: ${response.status}, text: ${generationErrorText}`)
    }
    const generation = await response.json()

    // download resulting image
    const url = generation.images[0].url
    console.log('Image URL:', url)

    const imageResponse = await fetch(url)
    if (!imageResponse.ok) {
      clearTimeout(timeoutId)
      const downloadErrorText = await imageResponse.text()
      console.error('Image download failed:', imageResponse.status, imageResponse.statusText, downloadErrorText)
      throw new Error(`Chyba při stahování obrázku, status: ${imageResponse.status}, text: ${downloadErrorText}`)
    }
    const imageBlob = await imageResponse.blob()
    const bufferImage = Buffer.from(await imageBlob.arrayBuffer())
    // crop to exact size
    const { data, error } = await cropImageBackEnd(bufferImage, imageParams.crop.width, imageParams.crop.height)
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
