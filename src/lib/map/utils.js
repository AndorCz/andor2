
export function getCanvasCoordinates (event, vtt, mapEl) {
  const rect = mapEl.getBoundingClientRect()
  const scaleX = vtt.app.screen.width / rect.width
  const scaleY = vtt.app.screen.height / rect.height

  // Adjust the mouse coordinates based on the scale
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY

  // Apply scene's scale to calculate the final local coordinates
  const localX = x / vtt.scene.scale.x
  const localY = y / vtt.scene.scale.y

  return { x: localX, y: localY }
}
