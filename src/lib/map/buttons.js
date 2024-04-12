
import { Container, Sprite } from 'pixi.js'

let app

export class Buttons {
  constructor (options) {
    Object.assign(this, options)
    app = options.app

    this.view = new Container()
    this.view.label = 'tokenButtons'
    this.view.visible = false
    app.stage.addChild(this.view)

    // button: remove token
    this.close = Sprite.from('/maps/button-close.png')
    this.close.anchor.set(0.5, 0.5)
    this.close.width = 40
    this.close.height = 40
    this.close.eventMode = 'static'
    this.close.buttonMode = true
    this.close.interactive = true
    this.close.cursor = 'pointer'
    this.close.on('pointerdown', () => { this.removeCharacter(app.selectedToken) })
    this.view.addChild(this.close)

    // button: done moving - remove proposition
    this.done = Sprite.from('/maps/button-done.png')
    this.done.width = 40
    this.done.height = 40
    this.done.anchor.set(0.5, 0.5)
    this.done.eventMode = 'static'
    this.done.buttonMode = true
    this.done.interactive = true
    this.done.cursor = 'pointer'
    this.done.x = 40
    this.done.on('pointerdown', () => { this.removeProposition(app.selectedToken) })
    this.view.addChild(this.done)
  }
}
