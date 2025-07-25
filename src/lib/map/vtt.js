import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js'
import { saveTransfrom, saveProposition, clearProposition, toggleFoW } from '@lib/map/db'
import { supabase } from '@lib/database-browser'
import { getImageUrl, getStamp } from '@lib/utils'
import { showError } from '@lib/toasts'
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
    // globalThis.__PIXI_APP__ = this.app // for chrome plugin

    // add map background image
    this.mapEl.appendChild(this.app.canvas)
    const mapUrl = getImageUrl(supabase, `${this.game.id}/${this.map.id}?${this.map.image}`, 'maps')
    this.mapTexture = await Assets.load({ src: mapUrl, loadParser: 'loadTextures' })
    const map = new Sprite({ texture: this.mapTexture, roundPixels: true })
    map.eventMode = 'none'
    map.label = 'map'

    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen
    this.app.stage
      .on('pointerup', this.onDragEnd, this)
      .on('pointerupoutside', this.onDragEnd, this)
      .on('pointerdown', this.deselectAll, this)

    // all objects are placed in scene container, as stage shouldn't be scaled. the true size is set in resize()
    this.scene = new Container({ x: 0, y: 0, width: this.app.screen.width, height: this.app.screen.height })
    this.scene.label = 'scene'
    this.app.scene = this.scene
    this.app.stage.addChild(this.scene)

    this.calculateSize()
    // fog of war
    if (this.map.fow) {
      if (this.map.fow_image) {
        const fowUrl = getImageUrl(supabase, `${this.game.id}/${this.map.id}_fow?${this.map.fow_image}`, 'maps')
        this.map.fowImage = await Assets.load({ src: fowUrl, loadParser: 'loadTextures' })
      }
      this.fow = new FoW({ vtt: this, map: this.map, app: this.app, scene: this.scene, isStoryteller: this.isStoryteller })
    }

    this.scene.addChild(map)
    this.resize()

    // draw propositions
    this.app.propositions = new Graphics({ label: 'propositionLines' })
    this.app.currentProposition = new Graphics({ label: 'currentProposition' })
    this.scene.addChild(this.app.propositions)
    this.scene.addChild(this.app.currentProposition)
    this.renderPropositions()

    // token buttons
    if (this.isStoryteller) {
      await Assets.load(['/maps/button-done.png', '/maps/button-close.png', '/maps/button-plus.png', '/maps/button-minus.png'])
      this.app.buttons = new Buttons({ app: this.app, tokenDiameter: this.tokenDiameter, removeCharacter: this.removeCharacter, removeProposition: this.removeProposition, changeTokenScale: this.changeTokenScale, changeAllTokenScale: this.changeAllTokenScale })
    }

    // add character tokens
    for (const id of Object.keys(this.map.characters)) {
      let characterData = this.game.characters.find(character => character.id === id)
      if (!characterData) { characterData = { player: 'npc', id, name: id } }
      await this.renderCharacter(characterData, this.map.characters[id])
    }

    window.addEventListener('resize', () => {
      this.calculateSize()
      this.resize()
      this.fow?.resize(this.scaledWidth, this.scaledHeight)
    })
    // app.ticker.add((time) => { fps = Math.round(app.ticker.FPS) })
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }

    return this.app
  }

  destroy () {
    window.removeEventListener('resize', this.resize)
  }

  calculateSize () {
    if (!this.mapEl) return
    const scale = Math.min((this.mapEl.offsetWidth / window.devicePixelRatio) / this.mapTexture.width, 1)
    this.scaledWidth = this.mapTexture.width * scale * window.devicePixelRatio
    this.scaledHeight = this.mapTexture.height * scale * window.devicePixelRatio
  }

  resize () { // might get scaled down
    this.scene.setSize(this.scaledWidth, this.scaledHeight)
    this.app.renderer.resize(this.scaledWidth, this.scaledHeight)
    this.mapWrapperEl.style.height = `${this.scaledHeight}px`
    this.fow?.resize()
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
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
    if (!delta) { return showError('Chybná hodnota změny velikosti') }
    this.app.scene.children.forEach(child => {
      if (child.label === 'character') {
        this.changeTokenScale(child, delta)
      }
    })
  }

  async enableFog () {
    this.map.fow = true
    if (this.map.fow_image) {
      const fowUrl = getImageUrl(supabase, `${this.game.id}/${this.map.id}_fow?${this.map.fow_image}`, 'maps')
      this.map.fowImage = await Assets.load({ src: fowUrl, loadParser: 'loadTextures' })
    }
    this.fow = new FoW({ vtt: this, map: this.map, app: this.app, scene: this.scene })
    this.fow.changeTool('light')
    await toggleFoW(this.map, true)
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }

  async disableFog () {
    this.fow.brushPreview.visible = false
    this.map.fow = true
    this.map.fow_image = getStamp()
    this.fow.destroy()
    await toggleFoW(this.map, false)
    if (!this.app.ticker.started) { this.app.renderer.render(this.app.stage) }
  }
}
