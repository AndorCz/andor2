
import { cropImageBackEnd } from '@lib/solo/server-utils.js'

export async function generateImage (prompt, cropWidth, cropHeight) {
  if (!prompt) { return { error: { message: 'Chybí prompt pro generování obrázku' } } }
  const width = Math.ceil(cropWidth / 32) * 32
  const height = Math.ceil(cropHeight / 32) * 32
  try {
    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + import.meta.env.AIML_API_KEY, 'Content-Type': 'application/json', },
      body: JSON.stringify({
        prompt: prompt,
        model: 'flux/schnell',
        image_size: { width, height } // max 1536x1536, multiples of 32
      })
    })
    if (!response.ok) { throw new Error(`Nevygenerován žádný obrázek, status: ${response.status}`) }
    const generation = await response.json()
    // download resulting image
    const url = generation.images[0].url
    const imageResponse = await fetch(url)
    if (!imageResponse.ok) { throw new Error(`Chyba při stahování obrázku, status: ${imageResponse.status}`) }
    const imageBlob = await imageResponse.blob()
    const bufferImage = Buffer.from(await imageBlob.arrayBuffer())
    // crop to exact size
    const { data, error } = await cropImageBackEnd(bufferImage, cropWidth, cropHeight)
    return { data, error }
  } catch (error) {
    console.error('Error generating image:', error)
    return { error: { message: 'Chyba při generování obrázku: ' + error.message } }
  }
}
