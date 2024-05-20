import { TextAlign as OriginalTextAlign } from '@tiptap/extension-text-align'

export const CustomTextAlign = OriginalTextAlign.extend({
  addOptions () {
    return {
      alignments: ['left', 'center', 'right', 'justify'],
      types: ['heading', 'paragraph']
    }
  },
  addAttributes () {
    return {
      textAlign: {
        default: null,
        parseHTML: element => element.style.textAlign || null,
        renderHTML: attributes => {
          if (!attributes.textAlign) return {}
          return { style: `text-align: ${attributes.textAlign}` }
        }
      }
    }
  }
})
