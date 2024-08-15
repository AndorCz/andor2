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
        case 'left': return 'float: left; margin-right: 20px;'
        case 'right': return 'float: right; margin-left: 20px;'
        case 'center': return 'display: block; margin-left: auto; margin-right: auto;'
        default: return ''
      }
    }
    const alignmentStyle = getAlignmentStyle(node.attrs.alignment)
    const imageWidth = node.attrs.width < this.editor.view.dom.offsetWidth ? node.attrs.width : this.editor.view.dom.offsetWidth
    // const aspectRatio = node.attrs.height / node.attrs.width
    const width = imageWidth ? `width: ${imageWidth * node.attrs.size / 100}px;` : ''
    const sizeStyle = `${width} object-fit: contain; max-width: 100%;` // height: fit-content is problematic in safari
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
        const newSize = Math.min(100, (node.attrs.size || 100) + 10)
        return commands.updateAttributes('image', { size: newSize }, pos)
      },
      decreaseImageSize: () => ({ state, commands }) => {
        const { selection } = state
        const { node, pos } = selection
        const newSize = Math.max(10, (node.attrs.size || 100) - 10)
        return commands.updateAttributes('image', { size: newSize }, pos)
      }
    }
  }
})
