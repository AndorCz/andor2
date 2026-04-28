import sharp from 'sharp'

export async function cropImageBackEnd (buffer, w, h) {
  try {
    const data = await sharp(buffer)
      .resize(w, h, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer()
    return { data }
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
