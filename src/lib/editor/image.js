
import { Image } from '@tiptap/extension-image'

export const CustomImage = Image.extend({
  name: 'image',

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
    function getAlignmentStyle (alignment) {
      switch (alignment) {
        case 'left': return 'float: left;'
        case 'right': return 'float: right;'
        case 'center': return 'display: block; margin-left: auto; margin-right: auto;'
        default: return ''
      }
    }
    const alignmentStyle = getAlignmentStyle(node.attrs.alignment)
    const sizeStyle = `width: ${node.attrs.width * node.attrs.size / 100}px; height: ${node.attrs.height * node.attrs.size / 100}px;`
    const style = `${alignmentStyle} ${sizeStyle}`
    return ['img', { ...HTMLAttributes, style }]
  },

  addCommands () {
    return {
      ...this.parent(),
      setImageAlignment: (alignment) => ({ commands }) => {
        return commands.updateAttributes('image', { alignment })
      },
      resetStyle: () => ({ commands }) => {
        return commands.updateAttributes('image', {
          alignment: 'none',
          size: 100
        })
      },
      increaseImageSize: () => ({ state, commands }) => {
        const { selection } = state
        const { node, pos } = selection
        const newSize = Math.min(200, (node.attrs.size || 100) + 20)
        return commands.updateAttributes('image', { size: newSize }, pos)
      },
      decreaseImageSize: () => ({ state, commands }) => {
        const { selection } = state
        const { node, pos } = selection
        const newSize = Math.max(20, (node.attrs.size || 100) - 20)
        return commands.updateAttributes('image', { size: newSize }, pos)
      }
    }
  }
})
