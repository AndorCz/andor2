import { Circle, Text, Sprite, Graphics, Assets, Texture } from 'pixi.js'
import { MaskContainer } from '@lib/pixi'
import { DropShadowFilter } from 'pixi-filters'
import { stringToColor } from '@lib/utils'

let app

// Class for handling character tokens

export class Character {
  constructor (options) {
    Object.assign(this, options)
    app = options.app
  }

  async init () {
    this.portraitTexture = this.characterData.portraitUrl ? await Assets.load(this.characterData.portraitUrl) : Texture.WHITE
    const portrait = Sprite.from(this.portraitTexture)
    if (!this.characterData.portraitUrl) {
      portrait.tint = this.characterData.color ? this.characterData.color : stringToColor(this.characterData.name)
    }
    const scale = Math.max(this.tokenDiameter / portrait.width, this.tokenDiameter / portrait.height)
    portrait.scale.set(scale)
    portrait.anchor.set(0.5, 0)

    // circle mask
    const tokenRadius = this.tokenDiameter / 2
    this.token = new MaskContainer() // workaround for missing pixi.js feature (interaction on masked sprites)
    const mask = new Graphics().circle(portrait.x, portrait.y, tokenRadius).fill('#fff')
    portrait.mask = mask
    mask.pivot.y = -tokenRadius // show head of the character
    this.token.pivot.y = tokenRadius // counteract the mask pivot
    this.token.label = 'character'
    this.token.character = this.characterData
    this.token.addChild(mask)
    this.token.addChild(portrait)
    this.token.filters = [new DropShadowFilter()]
    this.token.transform = this.transform
    this.token.scaleBackup = { x: this.token.scale.x, y: this.token.scale.y } // save scale
    this.token.scale.x = this.token.scale.x * (this.transform.scale || 1)
    this.token.scale.y = this.token.scale.y * (this.transform.scale || 1)
    this.token.x = this.transform.x
    this.token.y = this.transform.y
    this.token.hitArea = new Circle(portrait.x, portrait.y + tokenRadius, tokenRadius)
    this.token.character = this

    // selected circle
    const selectedCircle = new Graphics().circle(portrait.x, portrait.y, tokenRadius + 1).stroke({ width: 3, color: 0xffffff })
    selectedCircle.pivot.y = -tokenRadius
    selectedCircle.visible = false
    this.token.selectedCircle = selectedCircle
    this.token.addChild(selectedCircle)

    // add name
    const strokeColor = this.characterData.player === 'npc' ? '#634b41' : '#000'
    const name = new Text({ text: this.characterData.name, style: { lineHeight: 15, wordWrap: true, wordWrapWidth: 80, align: 'center', fontSize: 15, fontFamily: 'Alegreya Sans', fill: '#fff', fontWeight: 'bold', stroke: { color: strokeColor, width: 5 } } })
    name.anchor.set(0.5, 0.7)
    name.y = this.tokenDiameter
    this.token.addChild(name)

    // add interaction
    this.token.eventMode = 'static'
    this.token.cursor = 'pointer'
    this.token.on('pointerdown', this.onTokenPointerDown, this.token)
    this.token.on('pointerover', this.hover)
    this.token.on('pointerout', this.clear)
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  onTokenPointerDown (event) { // 'this' points to the clicked token sprite
    if (event.button !== 0) { return } // only left click
    event.stopPropagation()
    event.data.originalEvent.preventDefault()
    if (app.isStoryteller || app.user.id === this.character.characterData.player.id) {
      app.ticker.start()
      app.dragging = this.character
      if (app.selectedToken) { app.selectedToken.selectedCircle.visible = false } // deselect previous token
      this.alpha = 0.5
      this.start = { x: this.x, y: this.y }
      this.startGlobal = { x: event.data.global.x, y: event.data.global.y }
      app.stage.on('pointermove', this.character.onDragMove)
    }
  }

  onDragMove (event) { // 'this' points to the stage
    const token = app.dragging.token
    token.parent.toLocal(event.global, null, token.position)
    if (app.buttons) { app.buttons.contextual.visible = false }
    if (!app.isStoryteller) {
      app.dragging.drawProposition(token.start.x, token.start.y, token.x, token.y)
    }
  }

  select () {
    if (this.app.selectedToken) { this.app.selectedToken.selectedCircle.visible = false }
    this.app.selectedToken = this.token
    this.token.selectedCircle.visible = true
    if (app.isStoryteller) {
      const { x, y } = this.token.getGlobalPosition()
      this.app.buttons.contextual.visible = true
      this.app.buttons.done.visible = !!this.map.propositions[this.characterData.id]
      this.app.buttons.contextual.position.set(x, y - this.tokenDiameter)
      if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
    }
  }

  drawProposition (fromX, fromY, toX, toY) {
    this.app.currentProposition.clear()
    this.app.currentProposition.moveTo(fromX, fromY)
    this.app.currentProposition.lineTo(toX, toY)
    this.app.currentProposition.stroke({ width: 4, color: 0xffffff })
  }

  hover () { // 'this' is token
    this.scale.x += 0.1
    this.scale.y += 0.1
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }

  clear () {
    this.scale.x -= 0.1
    this.scale.y -= 0.1
    if (!app.ticker.started) { app.renderer.render(app.stage) }
  }
}
