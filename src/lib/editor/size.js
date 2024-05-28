import { Extension } from '@tiptap/core'

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions () {
    return {
      types: ['textStyle'],
      defaultSize: '20px', // setting default size to match the editor's general default
      getStyle: fontSize => `font-size: ${fontSize}`,
      fontSizeList: ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
    }
  },

  addGlobalAttributes () {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: this.options.defaultSize,
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
      const currentSize = state.selection.$head.marks()
        .find(mark => mark.type.name === 'textStyle')
        ?.attrs.fontSize || this.options.defaultSize

      // Find the closest size in the list
      return this.options.fontSizeList.reduce((prev, curr) =>
        Math.abs(parseInt(curr.replace('px', '')) - parseInt(currentSize.replace('px', ''))) < Math.abs(parseInt(prev.replace('px', '')) - parseInt(currentSize.replace('px', ''))) ? curr : prev
      )
    }

    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: this.options.defaultSize })
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
