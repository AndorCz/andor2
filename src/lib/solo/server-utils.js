async function getPhoton () {
  const module = await import('@cf-wasm/photon')
  const PhotonImage = module.PhotonImage
  const crop = module.crop
  const resize = module.resize
  const samplingFilter = module.SamplingFilter?.Lanczos3 || 5
  if (!PhotonImage?.new_from_byteslice || !crop || !resize) {
    throw new Error('Photon API není dostupné v tomto runtime')
  }
  return { PhotonImage, crop, resize, samplingFilter }
}

function getCoverCrop (sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceAspect = sourceWidth / sourceHeight
  const targetAspect = targetWidth / targetHeight
  let width = sourceWidth
  let height = sourceHeight
  let x = 0
  let y = 0

  if (sourceAspect > targetAspect) {
    width = Math.round(sourceHeight * targetAspect)
    x = Math.floor((sourceWidth - width) / 2)
  } else if (sourceAspect < targetAspect) {
    height = Math.round(sourceWidth / targetAspect)
    y = Math.floor((sourceHeight - height) / 2)
  }

  return {
    x,
    y,
    width: Math.max(1, Math.min(width, sourceWidth - x)),
    height: Math.max(1, Math.min(height, sourceHeight - y))
  }
}

async function toUint8Array (buffer) {
  if (buffer instanceof Uint8Array) return buffer
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer)
  if (buffer?.arrayBuffer) return new Uint8Array(await buffer.arrayBuffer())
  throw new Error('Nepodporovaný formát obrázkových dat')
}

export async function cropImageBackEnd (buffer, w, h) {
  let inputImage
  let croppedImage
  let outputImage
  try {
    const { PhotonImage, crop, resize, samplingFilter } = await getPhoton()
    inputImage = PhotonImage.new_from_byteslice(await toUint8Array(buffer))
    const sourceWidth = inputImage.get_width()
    const sourceHeight = inputImage.get_height()
    const cropBox = getCoverCrop(sourceWidth, sourceHeight, w, h)
    croppedImage = crop(inputImage, cropBox.x, cropBox.y, cropBox.x + cropBox.width, cropBox.y + cropBox.height)
    outputImage = resize(croppedImage, w, h, samplingFilter)
    const data = outputImage.get_bytes_jpeg(90)
    return { data: new Blob([data], { type: 'image/jpeg' }) }
  } catch (error) {
    console.error('Error cropping image:', error)
    return { error: { message: 'Chyba při zpracování obrázku: ' + (error.message || String(error)) } }
  } finally {
    outputImage?.free?.()
    croppedImage?.free?.()
    inputImage?.free?.()
  }
}

/**
 * Creates a Server-Sent Events stream from an async generator or stream
 */
export function createSSEStream (streamGenerator) {
  return new ReadableStream({
    async start (controller) {
      const encoder = new TextEncoder()
      try {
        for await (const data of streamGenerator) {
          const chunk = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (error) {
        console.error('SSE Stream error:', error)
      } finally {
        controller.close()
      }
    }
  })
}

/**
 * Helper to create SSE response headers
 */
export function getSSEHeaders () {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  }
}
