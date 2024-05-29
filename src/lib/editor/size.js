import { Extension } from '@tiptap/core'

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions () {
    return {
      types: ['textStyle'],
      defaultSizes: {
        paragraph: '20px',
        heading1: '40px',
        heading2: '30px',
        heading3: '23.4px'
      },
      getStyle: fontSize => `font-size: ${fontSize}`,
      fontSizeList: ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '40px']
    }
  },

  addGlobalAttributes () {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: this.options.getStyle(attributes.fontSize)
              }
            }
          }
        }
      }
    ]
  },

  addCommands () {
    const getCurrentSize = (state) => {
      const attrs = state.selection.$head.marks()
        .find(mark => mark.type.name === 'textStyle')?.attrs
      if (attrs && attrs.fontSize) {
        return attrs.fontSize
      }
      const node = state.selection.$head.parent
      if (node.type.name.startsWith('heading')) {
        return this.options.defaultSizes[`heading${node.attrs.level}`]
      }
      return this.options.defaultSizes.paragraph
    }

    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
      increaseSize: () => ({ chain, state }) => {
        const currentSize = getCurrentSize(state)
        const currentIndex = this.options.fontSizeList.indexOf(currentSize)
        if (currentIndex < this.options.fontSizeList.length - 1) {
          const nextSize = this.options.fontSizeList[currentIndex + 1]
          return chain().setMark('textStyle', { fontSize: nextSize }).run()
        }
      },
      decreaseSize: () => ({ chain, state }) => {
        const currentSize = getCurrentSize(state)
        const currentIndex = this.options.fontSizeList.indexOf(currentSize)
        if (currentIndex > 0) {
          const prevSize = this.options.fontSizeList[currentIndex - 1]
          return chain().setMark('textStyle', { fontSize: prevSize }).run()
        }
      },
      canIncreaseSize: () => ({ state }) => {
        const currentSize = getCurrentSize(state)
        const currentIndex = this.options.fontSizeList.indexOf(currentSize)
        return currentIndex < this.options.fontSizeList.length - 1
      },
      canDecreaseSize: () => ({ state }) => {
        const currentSize = getCurrentSize(state)
        const currentIndex = this.options.fontSizeList.indexOf(currentSize)
        return currentIndex > 0
      }
    }
  }
})
