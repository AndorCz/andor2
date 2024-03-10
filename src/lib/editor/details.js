
// Expandable details element for the tiptap editor

import { Node } from '@tiptap/core'

function findNode (doc, from, to, condition) {
  let result = null
  doc.nodesBetween(from, to, (node, pos) => {
    if (condition(node)) {
      result = { node, pos }
      return false // stop iterating
    }
  })
  return result
}

function findChildren (node, condition) {
  const children = []
  node.forEach((child, offset) => {
    if (condition(child)) {
      children.push({ node: child, pos: offset })
    }
  })
  return children
}

// Based on https://tiptap.dev/docs/editor/api/nodes/details

export const Details = Node.create({
  name: 'details',
  content: 'detailsSummary detailsContent',
  group: 'block',
  defining: true,
  isolating: true,
  allowGapCursor: false,

  // Add custom options for the extension
  addOptions () {
    return { openClassName: 'is-open', HTMLAttributes: {} }
  },

  // Define custom attributes for the extension
  addAttributes () { return [] },

  // Define how the HTML is parsed into the schema
  parseHTML () { return [{ tag: 'details' }] },

  // Define how the node is rendered to HTML
  renderHTML ({ HTMLAttributes }) {
    return ['details', Object.assign({}, this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  // Define the node view for more control over the DOM
  addNodeView () {
    return ({ editor, getPos, node, HTMLAttributes }) => {
      const container = document.createElement('div')
      const combinedAttributes = Object.assign({}, this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name
      })

      Object.entries(combinedAttributes).forEach(([key, value]) => {
        container.setAttribute(key, value)
      })

      const button = document.createElement('button')
      button.type = 'button'
      container.append(button)

      const contentDiv = document.createElement('div')
      container.append(contentDiv)

      const toggleOpen = () => {
        container.classList.toggle(this.options.openClassName)
        const event = new Event('toggleDetailsContent')
        const content = contentDiv.querySelector(':scope > div[data-type="detailsContent"]')
        if (content) { content.dispatchEvent(event) }
      }

      if (node.attrs.open) { setTimeout(toggleOpen) }

      button.addEventListener('click', () => {
        toggleOpen()

        if (editor.isEditable && typeof getPos === 'function') {
          const { from, to } = editor.state.selection
          editor.chain().command(({ tr }) => {
            const position = getPos()
            const currentNode = tr.doc.nodeAt(position)
            if (!currentNode || currentNode.type !== this.type) { return false }
            tr.setNodeMarkup(position, undefined, { open: !currentNode.attrs.open })
            return true
          }).setTextSelection({ from, to }).focus(undefined, {
            scrollIntoView: false
          }).run()
        }
      })

      return {
        dom: container,
        contentDOM: contentDiv,
        ignoreMutation (mutation) {
          if (mutation.type === 'selection') { return false }
          return !container.contains(mutation.target) || container === mutation.target
        },
        update (updatedNode) {
          return updatedNode.type === this.type
        }
      }
    }
  },

  addCommands () {
    return {
      setDetails: () => ({ state, chain }) => {
        const { schema, selection } = state
        const { $from, $to } = selection
        const range = $from.blockRange($to)

        if (!range) return false

        const slice = state.doc.slice(range.start, range.end)
        if (!schema.nodes.detailsContent.contentMatch.matchFragment(slice.content)) return false

        const content = slice.toJSON().content || []
        return chain().insertContentAt({
          from: range.start,
          to: range.end
        }, {
          type: this.name,
          content: [{ type: 'detailsSummary' }, { type: 'detailsContent', content }]
        }).setTextSelection(range.start + 2).run()
      },

      unsetDetails: () => ({ state, chain }) => {
        const { selection, schema, doc } = state
        const nodeRange = findNode(doc, selection.from, selection.to, node => node.type === schema.nodes.details)

        if (!nodeRange) return false

        const detailsSummary = findChildren(nodeRange.node, node => node.type === schema.nodes.detailsSummary)
        const detailsContent = findChildren(nodeRange.node, node => node.type === schema.nodes.detailsContent)

        if (!detailsSummary.length || !detailsContent.length) return false

        const summary = detailsSummary[0]
        const content = detailsContent[0]
        const position = nodeRange.pos
        const resolvedPos = state.doc.resolve(position)
        const endPos = position + nodeRange.node.nodeSize

        const replacementRange = { from: position, to: endPos }

        const contentJSON = content.node.content.toJSON() || []
        const defaultType = resolvedPos.parent.type.contentMatch.defaultType
        const newContent = [defaultType.create(null, summary.node.content).toJSON(), ...contentJSON]

        return chain().insertContentAt(replacementRange, newContent).setTextSelection(position + 1).run()
      }
    }
  },

  addKeyboardShortcuts () {
    return {
      Backspace: () => {
        const { state, commands } = this.editor
        const { schema, selection } = state
        const { empty, $anchor } = selection

        // Check if selection is empty and inside 'detailsSummary'
        if (!empty || $anchor.parent.type !== schema.nodes.detailsSummary) {
          return false
        }
        // If 'detailsSummary' is not empty, delete one character
        if ($anchor.parentOffset !== 0) {
          return commands.command(({ tr }) => {
            const startPos = $anchor.pos - 1
            const endPos = $anchor.pos
            tr.delete(startPos, endPos)
            return true
          })
        }
        // If 'detailsSummary' is empty, execute 'unsetDetails' command
        return commands.unsetDetails()
      }
    }
  }
})

// Based on https://tiptap.dev/docs/editor/api/nodes/details-summary

export const DetailsSummary = Node.create({
  name: 'detailsSummary',
  content: 'text*', // Allows only text content inside
  defining: true,
  selectable: false,
  isolating: true,

  // Add custom options for the extension
  addOptions () {
    return { HTMLAttributes: {} }
  },

  // Define how the HTML is parsed into the schema
  parseHTML () {
    return [{ tag: 'summary' }]
  },

  // Define how the node is rendered to HTML
  renderHTML ({ HTMLAttributes, node }) {
    // Add 'data-placeholder' attribute
    HTMLAttributes['data-placeholder'] = 'Popiš obsah'
    // Add 'is-empty' class if the node is empty
    if (node.content.size === 0) {
      HTMLAttributes.class = (HTMLAttributes.class || '') + ' is-empty'
    }
    return ['summary', HTMLAttributes, 0]
  }
})

// Based on https://tiptap.dev/docs/editor/api/nodes/details-content

export const DetailsContent = Node.create({
  name: 'detailsContent',
  content: 'block+', // Allows one or more block nodes
  defining: true,
  selectable: false,

  // Add custom options for the extension
  addOptions () { return { HTMLAttributes: {} } },

  // Define how the HTML is parsed into the schema
  parseHTML () { return [{ tag: `div[data-type="${this.name}"]` }] },

  // Define how the node is rendered to HTML
  renderHTML ({ HTMLAttributes }) {
    return ['div', Object.assign({}, this.options.HTMLAttributes, HTMLAttributes, { 'data-type': this.name }), 0]
  },

  // Define the node view for more control over the DOM
  addNodeView () {
    return ({ HTMLAttributes }) => {
      const contentDiv = document.createElement('div')
      const combinedAttributes = Object.assign({}, this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name
      })

      Object.entries(combinedAttributes).forEach(([key, value]) => {
        contentDiv.setAttribute(key, value)
      })

      // Add an event listener for toggling visibility
      contentDiv.addEventListener('toggleDetailsContent', () => {
        contentDiv.toggleAttribute('hidden')
      })

      return {
        dom: contentDiv,
        contentDOM: contentDiv,
        ignoreMutation (mutation) {
          if (mutation.type === 'selection') { return false }
          return !contentDiv.contains(mutation.target) || contentDiv === mutation.target
        },
        update (updatedNode) { return updatedNode.type === this.type }
      }
    }
  }
})
