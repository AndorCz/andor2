
import { Node, mergeAttributes } from '@tiptap/core'

export const Details = Node.create({
  name: 'details',
  content: 'summary block+',
  group: 'block',
  defining: true,

  parseHTML () {
    return [
      { tag: 'details' }
    ]
  },

  renderHTML ({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0]
  },

  addCommands () {
    return {
      setDetails: () => ({ commands }) => { return commands.wrapIn('details') },
      unsetDetails: () => ({ commands }) => { return commands.lift('details') }
    }
  }
})

export const Summary = Node.create({
  name: 'summary',
  content: 'inline*',
  parseHTML () {
    return [
      { tag: 'summary' }
    ]
  },
  renderHTML () {
    return ['summary', 0]
  }
})
