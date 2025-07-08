import { Jimp } from 'jimp'

export async function cropImageBackEnd (buffer, w, h) {
  try {
    const image = await Jimp.read(buffer)
    image.cover({ w, h }) // resize/crop to header size (centered)
    return { data: await image.getBuffer('image/jpeg') }
  } catch (error) {
    console.error('Error cropping image:', error)
    return { error: 'Chyba při zpracování obrázku' }
  }
}

/**
 * Creates a Server-Sent Events stream from an async generator or stream
 */
export function createSSEStream(streamGenerator) {
  return new ReadableStream({
    async start(controller) {
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
export function getSSEHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
}
