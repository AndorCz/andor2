import { Jimp } from 'jimp'

export async function cropImageBackEnd (buffer) {
  try {
    const image = await Jimp.read(buffer)
    image.cover({ w: 1100, h: 226 }) // resize/crop to header size (centered)
    return { data: await image.getBuffer('image/jpeg') }
  } catch (error) {
    console.error('Error cropping image:', error)
    return { error: 'Chyba při zpracování obrázku' }
  }
}
