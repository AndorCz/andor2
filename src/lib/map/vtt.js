import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js'
import { saveTransfrom, saveProposition, clearProposition } from '@lib/map/db'
import { getImageUrl } from '@lib/database'
import { Buttons } from '@lib/map/buttons'
import { FoW } from '@lib/map/fow'

export class Vtt {
  constructor (options) {
    Object.assign(this, options)
    this.app = new Application()
    this.app.user = this.user
    this.app.isStoryteller = this.isStoryteller
  }

  async init () {
    // to render every frame, set autoStart to true. other options: { backgroundAlpha: 0, resizeTo: mapEl, autoDensity: true, antialias: true, width: mapEl.clientWidth, height: mapEl.clientHeight }
    await this.app.init({ autoStart: false, resolution: window.devicePixelRatio, autoDensity: true, antialias: true })
    // globalThis.__PIXI_APP__ = app // for chrome plugin

    // add map background image
    this.mapEl.appendChild(this.app.canvas)
    const mapUrl = getImageUrl(`${this.game.id}/${this.map.id}?${this.map.image}`, 'maps')
    this.mapTexture = await Assets.load({ src: mapUrl, loadParser: 'loadTextures' })
    const mapSprite = new Sprite(this.mapTexture)
    mapSprite.eventMode = 'none'
    mapSprite.label = 'map'

    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen
    this.app.stage
      .on('pointerup', this.onDragEnd, this)
      .on('pointerupoutside', this.onDragEnd, this)
      .on('pointerdown', this.deselectAll, this)

    this.scene = new Container({ x: 0, y: 0, width: this.app.screen.width, height: this.app.screen.height })
    this.scene.label = 'scene'
    this.app.scene = this.scene
    this.app.stage.addChild(this.scene)
    this.scene.addChild(mapSprite)
    this.resize()

    // draw propositions
    this.app.propositions = new Graphics({ label: 'propositionLines' })
    this.app.currentProposition = new Graphics({ label: 'currentProposition' })
    this.scene.addChild(this.app.propositions)
    this.scene.addChild(this.app.currentProposition)
    this.renderPropositions()

    // fog of war
    // this.app.fow = new FoW({ map: this.map, scene: this.scene, app: this.app })

    // token buttons
    if (this.isStoryteller) {
      await Assets.load(['/maps/button-done.png', '/maps/button-close.png', '/maps/button-plus.png', '/maps/button-minus.png'])
      this.app.buttons = new Buttons({ app: this.app, tokenDiameter: this.tokenDiameter, removeCharacter: this.removeCharacter, removeProposition: this.removeProposition, changeTokenScale: this.changeTokenScale, changeAllTokenScale: this.changeAllTokenScale })
    }

    // add character tokens
    for (const id of Object.keys(this.map.characters)) {
      await this.renderCharacter(id, this.map.characters[id])
    }

    window.addEventListener('resize', () => { this.resize() })
    // app.ticker.add((time) => { fps = Math.round(app.ticker.FPS) })
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }

    return this.app
  }

  destroy () {
    window.removeEventListener('resize', this.resize)
  }

  onDragEnd (event) {
    setTimeout(() => { this.app.ticker.stop() }, 100)
    if (this.app.dragging) {
      this.app.stage.off('pointermove', this.onDragMove)
      this.app.dragging.token.alpha = 1
      const moveX = Math.abs(this.app.dragging.token.startGlobal.x - event.data.global.x)
      const moveY = Math.abs(this.app.dragging.token.startGlobal.y - event.data.global.y)

      if (moveX <= 2 && moveY <= 2) { // token clicked
        this.app.dragging.select()
      } else { // drag ended
        if (this.isStoryteller) {
          saveTransfrom(this.map, this.app.dragging.characterData, this.app.dragging.token.x, this.app.dragging.token.y, this.app.dragging.token.transform.scale)
        } else {
          saveProposition(this.map, this.app.dragging.characterData, this.app.dragging.token.x, this.app.dragging.token.y)
          this.app.dragging.token.x = this.app.dragging.token.start.x
          this.app.dragging.token.y = this.app.dragging.token.start.y
        }
      }
      delete this.app.dragging
    }
  }

  resize () {
    if (!this.mapEl) return
    const scale = Math.min((this.mapEl.offsetWidth / window.devicePixelRatio) / this.mapTexture.width, 1)
    this.scaledWidth = this.mapTexture.width * scale * window.devicePixelRatio
    this.scaledHeight = this.mapTexture.height * scale * window.devicePixelRatio
    // scene.scale.set(scale, scale) // not needed
    this.scene.width = this.scaledWidth
    this.scene.height = this.scaledHeight
    this.app.renderer.resize(this.scaledWidth, this.scaledHeight)
    this.mapWrapperEl.style.height = `${this.scaledHeight}px`
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  renderPropositions () {
    this.app.propositions.clear()
    for (const id of Object.keys(this.map.propositions)) {
      const proposition = this.map.propositions[id]
      const from = this.map.characters[id]
      if (from) {
        this.app.propositions.moveTo(from.x, from.y)
        this.app.propositions.lineTo(proposition.x, proposition.y)
        this.app.propositions.stroke({ width: 4, color: 0xffffff })
      }
    }
  }

  removeProposition (token) {
    delete this.map.propositions[token.character.characterData.id]
    clearProposition(this.map, token.character.characterData.id)
    this.renderPropositions()
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  deselectAll (event) {
    if (event.button !== 0) { return } // only left click
    event.data.originalEvent.preventDefault()
    if (this.app.selectedToken) {
      this.app.selectedToken.selectedCircle.visible = false
      this.app.selectedToken = null
    }
    if (this.app.buttons) { this.app.buttons.contextual.visible = false }
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  changeTokenScale (token, delta) { // buttons context
    token.transform.scale += delta
    if (token.transform.scale < 0.1) { return }
    token.scale.x = token.scaleBackup.x * token.transform.scale
    token.scale.y = token.scaleBackup.y * token.transform.scale
    saveTransfrom(token.character.map, token.character.characterData, token.x, token.y, token.transform.scale)
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  changeAllTokenScale (delta) { // buttons context
    this.app.scene.children.forEach(child => {
      if (child.label === 'character') {
        this.changeTokenScale(child, delta)
      }
    })
  }

  addFog () {
    this.fogEnabled = true
  }

  clearFog () {
    this.fogEnabled = false
  }
}
