// Serialize writes so a slower request cannot overwrite newer edits.
export function createNoteSaver (write, onState, delay = 700) {
  let pending
  let running
  let timer

  function enqueue (value) {
    pending = structuredClone(value)
    clearTimeout(timer)
    onState('pending')
    timer = setTimeout(() => { flush().catch(() => {}) }, delay)
  }

  async function flush () {
    clearTimeout(timer)
    if (running) {
      await running
      if (pending) { return flush() }
      return
    }
    running = (async () => {
      while (pending) {
        const snapshot = pending
        pending = undefined
        onState('saving')
        try {
          await write(snapshot)
        } catch (error) {
          pending ||= snapshot
          onState('error')
          throw error
        }
      }
      onState('saved')
    })()
    try { await running } finally { running = undefined }
  }

  return { enqueue, flush, isDirty: () => !!(pending || running), destroy: () => clearTimeout(timer) }
}
