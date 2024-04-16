import { RenderTexture, Sprite, Graphics, Rectangle, BlurFilter } from 'pixi.js'

let app
let drawing = false

const radius = 100
const blurSize = 32

// Class for drawing fog of war

export class FoW {
  constructor (options) {
    Object.assign(this, options)
    app = options.app
    this.activeTool = 'select'

    // draw the black fog to be masked
    this.fogTexture = RenderTexture.create({ width: app.screen.width, height: app.screen.height })
    const background = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x000000)
    app.renderer.render({ container: background, target: this.fogTexture }) // draw the black rectangle onto the texture
    this.fog = new Sprite(this.fogTexture)
    this.fog.interactive = true
    app.stage.addChild(this.fog)

    // prepare brushes
    const bounds = new Rectangle(0, 0, (radius + blurSize) * 2, (radius + blurSize) * 2)
    this.lightBrushGraphics = new Graphics().circle(radius + blurSize, radius + blurSize, radius).fill({ color: 0x000000 }) // colors in mask are inversed
    this.lightBrushGraphics.filters = [new BlurFilter({ strength: blurSize, quality: 6 })]
    this.lightBrushTexture = app.renderer.generateTexture({ target: this.lightBrushGraphics, frame: bounds })
    this.lightBrush = new Sprite(this.lightBrushTexture)
    this.activeBrush = this.lightBrush // active by default
    // 2DO: try using .TINT instead
    this.darkBrushGraphics = new Graphics().circle(radius + blurSize, radius + blurSize, radius).fill({ color: 0xffffff }) // colors in mask are inversed
    this.darkBrushGraphics.filters = [new BlurFilter({ strength: blurSize, quality: 6 })]
    this.darkBrushTexture = app.renderer.generateTexture({ target: this.darkBrushGraphics, frame: bounds })
    this.darkBrush = new Sprite(this.darkBrushTexture)

    // prepare mask
    this.maskTexture = RenderTexture.create({ width: app.screen.width, height: app.screen.height })
    const white = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0xffffff)
    app.renderer.render({ container: white, target: this.maskTexture }) // draw white rectangle onto the texture
    this.maskSprite = new Sprite(this.maskTexture)
    app.stage.addChild(this.maskSprite)
    this.fog.mask = this.maskSprite

    this.activeTool !== 'select' ? this.enableDrawing() : this.disableDrawing()

    this.resize()
    window.addEventListener('resize', () => { this.resize() })
  }

  destroy () {
    this.fog.destroy()
    window.removeEventListener('resize', () => { this.resize() })
  }

  resize () {
    // might get scaled down
    this.fog.width = this.scene.width
    this.fog.height = this.scene.height
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  pointerDown (event) {
    if (event.button !== 0) { return } // only left click
    drawing = true
    app.ticker.start()
    this.draw(event.global)
  }

  pointerMove (event) {
    if (drawing) { this.draw(event.global) }
  }

  pointerUp () {
    drawing = false
    setTimeout(() => { app.ticker.stop() }, 100)
  }

  enableDrawing () {
    this.fog.alpha = 0.9
    this.fog.eventMode = 'passive' // the order of lines matters
    this.fog.interactive = true // the order of lines matters
    this.fog.on('pointerdown', this.pointerDown, this)
    this.fog.on('pointermove', this.pointerMove, this)
    this.fog.on('pointerup', this.pointerUp, this)
  }

  disableDrawing () {
    this.fog.alpha = 0.5
    this.fog.interactive = true // the order of lines matters
    this.fog.eventMode = 'none' // the order of lines matters
    this.fog.off('pointerdown', this.pointerDown)
    this.fog.off('pointermove', this.pointerMove)
    this.fog.off('pointerup', this.pointerUp)
  }

  changeTool (tool) {
    this.activeTool = tool
    if (tool === 'select') {
      this.disableDrawing()
    } else {
      if (tool === 'light') {
        this.lightBrush.visible = true
        this.darkBrush.visible = false
        this.activeBrush = this.lightBrush
      }
      if (tool === 'dark') {
        this.darkBrush.visible = true
        this.lightBrush.visible = false
        this.activeBrush = this.darkBrush
      }
      this.enableDrawing()
    }
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  draw (pos) {
    this.activeBrush.position.set(pos.x - (radius + blurSize), pos.y - (radius + blurSize))
    app.renderer.render({ container: this.activeBrush, target: this.maskTexture, clear: false })
  }
}
