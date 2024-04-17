import { RenderTexture, Sprite, Graphics, Rectangle, BlurFilter } from 'pixi.js'
import { showError } from '@lib/toasts'
import { previewCanvas } from '@lib/utils'
import { saveFow } from '@lib/map/db'

let app
let drawing = false

const visibleFogAlpha = 0.9
const hiddenFogAlpha = 0.5

// Class for drawing fog of war

export class FoW {
  constructor (options) {
    Object.assign(this, options)
    app = options.app
    this.activeTool = 'select'
    this.radius = 100
    this.blurSize = Math.max(this.radius / 2, 10)

    const width = this.map.fowImage ? this.map.fowImage.width : this.vtt.scaledWidth
    const height = this.map.fowImage ? this.map.fowImage.height : this.vtt.scaledHeight

    // draw the black fog to be masked
    this.fogTexture = RenderTexture.create({ width, height, resolution: 1 })
    const background = new Graphics().rect(0, 0, width, height).fill(0x000000)
    app.renderer.render({ container: background, target: this.fogTexture })

    this.fog = new Sprite(this.fogTexture)
    this.fog.label = 'fogBlack'
    this.fog.interactive = true
    this.fog.eventMode = 'none'
    this.fog.alpha = this.isStoryteller ? hiddenFogAlpha : 1
    app.stage.addChild(this.fog)

    this.createBrush()

    // prepare mask
    this.maskTexture = RenderTexture.create({ width, height, resolution: 1 })
    const mask = this.map.fowImage ? new Sprite({ texture: this.map.fowImage, roundPixels: true, resolution: 1 }) : new Graphics().rect(0, 0, width, height).fill(0xffffff)
    app.renderer.render({ container: mask, target: this.maskTexture }) // draw white rectangle onto the texture

    this.maskSprite = new Sprite({ texture: this.maskTexture, roundPixels: true, resolution: 1 })
    this.maskSprite.label = 'fogMask'
    app.stage.addChild(this.maskSprite)
    this.fog.mask = this.maskSprite

    // prepare brush size preview circle
    this.brushPreview = new Graphics().circle(0, 0, this.radius + this.blurSize).stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
    this.brushPreview.visible = false
    app.stage.addChild(this.brushPreview)

    this.fog.on('pointermove', this.pointerMove, this)
    this.resize()
  }

  createBrush () {
    const bounds = new Rectangle(0, 0, (this.radius + this.blurSize) * 2, (this.radius + this.blurSize) * 2)
    const circle = new Graphics().circle(this.radius + this.blurSize, this.radius + this.blurSize, this.radius).fill({ color: 0xffffff }) // colors in mask are inversed
    circle.filters = [new BlurFilter({ strength: this.blurSize, quality: 6 })]
    this.brushTexture = app.renderer.generateTexture({ target: circle, frame: bounds })
    this.brush = new Sprite({ texture: this.brushTexture, roundPixels: true })
  }

  destroy () {
    this.fog.destroy()
    window.removeEventListener('resize', () => { this.resize() })
  }

  resize () { // might get scaled down
    this.maskSprite.setSize(this.vtt.scaledWidth, this.vtt.scaledHeight)
    this.fog.setSize(this.vtt.scaledWidth, this.vtt.scaledHeight)
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  pointerDown (event) {
    if (event.button !== 0) { return } // only left click
    drawing = true
    app.ticker.start()
    this.draw(event.global)
  }

  pointerMove (event) {
    requestAnimationFrame(() => {
      if (this.activeTool !== 'select') {
        this.brushPreview.position.set(event.global.x, event.global.y)
        if (!drawing && !this.app.ticker.started) { this.app.renderer.render(this.app.stage) } // render preview only if not drawing, otherwise it's rendered
      }
      if (drawing) { this.draw(event.global) }
    })
  }

  pointerUp () {
    drawing = false
    setTimeout(() => { app.ticker.stop() }, 100)
  }

  enableDrawing () {
    this.fog.alpha = visibleFogAlpha
    this.fog.eventMode = 'passive' // the order of lines matters
    this.fog.interactive = true // the order of lines matters
    this.fog.on('pointerdown', this.pointerDown, this)
    // this.fog.on('pointermove', this.pointerMove, this)
    this.fog.on('pointerup', this.pointerUp, this)
  }

  disableDrawing () {
    this.fog.alpha = hiddenFogAlpha
    this.fog.interactive = true // the order of lines matters
    this.fog.eventMode = 'none' // the order of lines matters
    this.fog.off('pointerdown', this.pointerDown)
    // this.fog.off('pointermove', this.pointerMove)
    this.fog.off('pointerup', this.pointerUp)
  }

  changeTool (tool) {
    this.activeTool = tool
    if (tool === 'select') {
      this.brush.visible = false
      this.disableDrawing()
      this.brushPreview.visible = false
    } else {
      this.brush.visible = true
      this.brushPreview.visible = true
      this.enableDrawing()
    }
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  changeBrushSize (multiplier) {
    if (!multiplier) { return showError('Chybná hodnota změny velikosti') }
    if (this.radius * multiplier < 5 || this.radius * multiplier > 500) { return }
    this.radius *= multiplier
    this.blurSize = Math.max(this.radius / 2, 10)
    this.createBrush()
    this.brushPreview.clear().circle(0, 0, this.radius + this.blurSize).stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  draw (pos) {
    if (this.activeTool === 'light') { this.brush.tint = 0x000000 }
    if (this.activeTool === 'dark') { this.brush.tint = 0xffffff }
    const coords = this.maskSprite.toLocal(pos)
    this.brush.position.set(coords.x - (this.radius + this.blurSize), coords.y - (this.radius + this.blurSize))
    app.renderer.render({ container: this.brush, target: this.maskTexture, clear: false })
    this.vtt.onFowChange()
  }

  async save () {
    const canvas = await app.renderer.extract.canvas({ target: this.maskTexture, resolution: 1 })
    previewCanvas(canvas)
    const blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
    await saveFow(this.map, blob)
  }
}
