import { Image } from 'imagescript'

export async function cropImageBackEnd (buffer, w, h) {
  try {
    const image = await Image.decode(buffer)
    const data = await image.cover(w, h).encodeJPEG(90)
    return { data: new Blob([data], { type: 'image/jpeg' }) }
  } catch (error) {
    console.error('Error cropping image:', error)
    return { error: { message: 'Chyba při zpracování obrázku: ' + (error.message || String(error)) } }
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
