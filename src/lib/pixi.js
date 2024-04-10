import { Container } from 'pixi.js'

// https://github.com/pixijs/pixijs/issues/6509

export class MaskContainer extends Container {
  containsPoint (point) {
    for (const child of this.children) {
      if (typeof (child).containsPoint === 'function') {
        if ((child).containsPoint(point)) return true
      }
    }
    return false
  }
}
