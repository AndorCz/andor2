/**
 * Processes a text stream from a response and appends the content to the output.
 * @param {Response} response - The fetch response object containing the text stream.
 * @param {function} onUpdate - Callback function to update the output with generated content.
 * @returns {Promise<void>} - A promise that resolves when the stream has been fully processed.
 */
export async function outputTextStream (response, onUpdate) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let done = false
  let generatedContent = ''
  while (!done) {
    const { value, done: doneReading } = await reader.read()
    done = doneReading
    const chunkValue = decoder.decode(value, { stream: !done })
    generatedContent += chunkValue
    if (onUpdate) onUpdate(generatedContent)
  }
}
