
import { Container, Sprite } from 'pixi.js'

let app

export class Buttons {
  constructor (options) {
    Object.assign(this, options)
    app = options.app

    this.contextual = new Container()
    this.contextual.label = 'contextualButtons'
    this.contextual.visible = false
    app.stage.addChild(this.contextual)

    // CONTEXTUAL BUTTONS

    // button: remove token
    this.close = Sprite.from('/maps/button-close.png')
    this.close.anchor.set(0.5, 0.5)
    this.close.width = 40
    this.close.height = 40
    this.close.eventMode = 'static'
    this.close.interactive = true
    this.close.cursor = 'pointer'
    this.contextual.addChild(this.close)
    const scaleBackup = { x: this.close.scale.x, y: this.close.scale.y } // save scale
    const scaleHover = { x: scaleBackup.x * 1.2, y: scaleBackup.y * 1.2 }
    this.close.on('pointerdown', () => { this.removeCharacter(app.selectedToken) })
    this.close.on('pointerover', () => { this.close.scale = scaleHover })
    this.close.on('pointerout', () => { this.close.scale = scaleBackup })

    // button: done moving - remove proposition
    this.done = Sprite.from('/maps/button-done.png')
    this.done.width = 40
    this.done.height = 40
    this.done.anchor.set(0.5, 0.5)
    this.done.eventMode = 'static'
    this.done.interactive = true
    this.done.cursor = 'pointer'
    this.done.x = 40
    this.done.on('pointerdown', () => { this.removeProposition(app.selectedToken) })
    this.done.on('pointerover', () => { this.done.scale = scaleHover })
    this.done.on('pointerout', () => { this.done.scale = scaleBackup })
    this.contextual.addChild(this.done)

    // button: shrink
    this.minus = Sprite.from('/maps/button-minus.png')
    this.minus.width = 40
    this.minus.height = 40
    this.minus.anchor.set(0.5, 0.5)
    this.minus.eventMode = 'static'
    this.minus.interactive = true
    this.minus.cursor = 'pointer'
    this.minus.y = this.tokenDiameter * 2
    this.minus.x = -20
    this.minus.on('pointerdown', () => { this.changeTokenScale(app.selectedToken, -0.2) })
    this.minus.on('pointerover', () => { this.minus.scale = scaleHover })
    this.minus.on('pointerout', () => { this.minus.scale = scaleBackup })
    this.contextual.addChild(this.minus)

    // button: enlarge
    this.plus = Sprite.from('/maps/button-plus.png')
    this.plus.width = 40
    this.plus.height = 40
    this.plus.anchor.set(0.5, 0.5)
    this.plus.eventMode = 'static'
    this.plus.interactive = true
    this.plus.cursor = 'pointer'
    this.plus.y = this.tokenDiameter * 2
    this.plus.x = 20
    this.plus.on('pointerdown', () => { this.changeTokenScale(app.selectedToken, 0.2) })
    this.plus.on('pointerover', () => { this.plus.scale = scaleHover })
    this.plus.on('pointerout', () => { this.plus.scale = scaleBackup })
    this.contextual.addChild(this.plus)

    // GLOBAL BUTTONS

    this.global = new Container()
    this.global.label = 'globalButtons'
    app.stage.addChild(this.global)

    this.minusAll = Sprite.from('/maps/button-minus.png')
    this.minusAll.width = 40
    this.minusAll.height = 40
    this.minusAll.anchor.set(0.5, 0.5)
    this.minusAll.eventMode = 'static'
    this.minusAll.interactive = true
    this.minusAll.cursor = 'pointer'
    this.minusAll.y = 20
    this.minusAll.x = 20
    this.minusAll.on('pointerdown', () => { this.changeAllTokenScale(-0.2) })
    this.minusAll.on('pointerover', () => { this.minusAll.scale = scaleHover; this.render() })
    this.minusAll.on('pointerout', () => { this.minusAll.scale = scaleBackup; this.render() })
    this.global.addChild(this.minusAll)

    this.plusAll = Sprite.from('/maps/button-plus.png')
    this.plusAll.width = 40
    this.plusAll.height = 40
    this.plusAll.anchor.set(0.5, 0.5)
    this.plusAll.eventMode = 'static'
    this.plusAll.interactive = true
    this.plusAll.cursor = 'pointer'
    this.plusAll.y = 20
    this.plusAll.x = 60
    this.plusAll.on('pointerdown', () => { this.changeAllTokenScale(0.2) })
    this.plusAll.on('pointerover', () => { this.plusAll.scale = scaleHover; this.render() })
    this.plusAll.on('pointerout', () => { this.plusAll.scale = scaleBackup; this.render() })
    this.global.addChild(this.plusAll)
  }

  render () {
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }
}
