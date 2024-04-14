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

    // draw the black fog to be masked
    this.fogTexture = RenderTexture.create({ width: app.screen.width, height: app.screen.height })
    const background = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x000000)
    app.renderer.render({ container: background, target: this.fogTexture }) // draw the black rectangle onto the texture
    this.fogSprite = new Sprite(this.fogTexture)
    app.stage.addChild(this.fogSprite)

    // prepare brush
    const bounds = new Rectangle(0, 0, (radius + blurSize) * 2, (radius + blurSize) * 2)
    this.brush = new Graphics().circle(radius + blurSize, radius + blurSize, radius).fill({ color: 0x000000 })
    this.brush.filters = [new BlurFilter({ strength: blurSize, quality: 6 })]
    this.brushTexture = app.renderer.generateTexture({ target: this.brush, frame: bounds })
    this.brushSprite = new Sprite(this.brushTexture)

    // prepare mask
    this.maskTexture = RenderTexture.create({ width: app.screen.width, height: app.screen.height })
    const white = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0xffffff)
    app.renderer.render({ container: white, target: this.maskTexture }) // draw white rectangle onto the texture
    this.maskSprite = new Sprite(this.maskTexture)
    app.stage.addChild(this.maskSprite)
    this.fogSprite.mask = this.maskSprite

    this.fogSprite.interactive = true
    this.fogSprite.on('pointerup', () => {
      drawing = false
      setTimeout(() => { app.ticker.stop() }, 100)
    })
    this.fogSprite.on('pointerdown', (event) => {
      drawing = true
      app.ticker.start()
      this.drawLight(event.global)
    })
    this.fogSprite.on('pointermove', (event) => {
      if (drawing) {
        this.drawLight(event.global)
      }
    })
  }

  drawLight (pos) {
    this.brushSprite.position.set(pos.x - (radius + blurSize), pos.y - (radius + blurSize))
    app.renderer.render({ container: this.brushSprite, target: this.maskTexture, clear: false })
  }
}
