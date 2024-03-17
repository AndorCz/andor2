
import { Image } from '@tiptap/extension-image'

export const CustomImage = Image.extend({
  name: 'customImage',

  addAttributes () {
    return {
      ...this.parent(),
      alignment: { default: 'none' },
      size: { default: 100 },
      width: { default: null },
      height: { default: null }
    }
  },

  renderHTML ({ node, HTMLAttributes }) {
    const alignmentStyle = node.attrs.alignment !== 'none' ? `float: ${node.attrs.alignment};` : ''
    const sizeStyle = `width: ${node.attrs.width * node.attrs.size / 100}px; height: ${node.attrs.height * node.attrs.size / 100}px;`
    const style = `${alignmentStyle} ${sizeStyle}`
    return ['img', { ...HTMLAttributes, style }, 0]
  },

  addCommands () {
    return {
      ...this.parent(),
      setImageAlignment: (alignment) => ({ commands }) => {
        return commands.updateAttributes('customImage', { alignment })
      },
      increaseImageSize: () => ({ state, commands }) => {
        const { selection } = state
        const { node, pos } = selection
        const newSize = Math.min(200, (node.attrs.size || 100) + 20)
        return commands.updateAttributes('customImage', { size: newSize }, pos)
      },
      decreaseImageSize: () => ({ state, commands }) => {
        const { selection } = state
        const { node, pos } = selection
        const newSize = Math.max(20, (node.attrs.size || 100) - 20)
        return commands.updateAttributes('customImage', { size: newSize }, pos)
      }
    }
  }
})
