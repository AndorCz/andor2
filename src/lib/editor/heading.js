import { Heading as OriginalHeading } from '@tiptap/extension-heading'

export const CustomHeading = OriginalHeading.extend({
  addAttributes () {
    return {
      ...this.parent?.(),
      textAlign: {
        default: null,
        parseHTML: element => element.style.textAlign || null,
        renderHTML: attributes => {
          if (!attributes.textAlign) return {}
          return { style: `text-align: ${attributes.textAlign}` }
        }
      }
    }
  },
  addCommands () {
    return {
      setHeading: options => ({ commands, editor }) => {
        const currentAlign = editor.getAttributes('paragraph').textAlign || null
        return commands.setNode('heading', { ...options, textAlign: currentAlign })
      }
    }
  }
})
