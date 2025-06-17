import { Jimp } from 'jimp'

export async function cropImageBackEnd (blob) {
  const image = await Jimp.read(blob)
  image.cover(1100, 226) // resize/crop to header size (centered)
  return await image.getBufferAsync(Jimp.MIME_JPG)
}
