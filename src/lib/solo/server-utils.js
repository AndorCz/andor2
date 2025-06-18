import { Jimp } from 'jimp'

export async function cropImageBackEnd (buffer) {
  const image = await Jimp.read(buffer)
  image.cover(1100, 226) // resize/crop to header size (centered)
  return await image.getBuffer(Jimp.MIME_JPG)
}
