import { Node, mergeAttributes } from '@tiptap/core'

export const Reply = Node.create({
  name: 'reply',

  // Define the HTML element to use
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes () {
    return {
      postId: { default: null },
      name: { default: null },
      content: { default: null }
    }
  },

  addCommands () {
    return {
      addReply: options => ({ tr, dispatch }) => {
        const { selection } = tr
        const { from } = selection
        const node = this.type.create(options)
        if (dispatch) {
          tr.replaceRangeWith(from, from, node)
          tr.insertText(' ', from + node.nodeSize) // Insert a space after the node
        }
        return true
      }
    }
  },

  // Define how the node will be rendered to HTML
  renderHTML ({ node }) {
    return ['cite', mergeAttributes({ class: 'button', 'data-id': node.attrs.postId, 'data-name': node.attrs.name, 'data-content': node.attrs.content }), `${node.attrs.name}: ${node.attrs.content}`]
  },

  // Define how the node will be parsed from HTML (if you need to parse existing content)
  parseHTML () {
    return [
      {
        tag: 'cite[data-id]',
        getAttrs: node => ({
          postId: node.getAttribute('data-id'),
          name: node.getAttribute('data-name'),
          content: node.getAttribute('data-content')
        })
      }
    ]
  }
})
