import { Node, mergeAttributes } from '@tiptap/core'

function applyAttributes (element, attributes = {}) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === false || value === null || typeof value === 'undefined') {
      element.removeAttribute(key)
    } else if (value === true) {
      element.setAttribute(key, '')
    } else {
      element.setAttribute(key, value)
    }
  })
}

function generateId (prefix = 'poll') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`
}

function createPollOptionNode (text) {
  const content = (text || '').trim()
  return {
    type: 'pollOption',
    attrs: { optionId: generateId('poll-option') },
    content: content ? [{ type: 'text', text: content }] : []
  }
}

export const PollOption = Node.create({
  name: 'pollOption',
  group: 'block',
  content: 'inline*',
  defining: true,
  selectable: false,

  addAttributes () {
    return {
      optionId: {
        default: null,
        parseHTML: element => element.getAttribute('data-option-id'),
        renderHTML: attributes => ({ 'data-option-id': attributes.optionId })
      }
    }
  },

  parseHTML () {
    return [
      { tag: 'div[data-option-id]' }
    ]
  },

  renderHTML ({ HTMLAttributes, node }) {
    const merged = mergeAttributes({ class: 'poll-option' }, HTMLAttributes)
    const labelAttributes = {
      class: 'poll-option-label',
      'data-placeholder': 'Možnost'
    }

    if (node.content.size === 0) {
      labelAttributes.class += ' is-empty'
    }

    return [
      'div',
      merged,
      ['span', labelAttributes, 0],
      ['span', { class: 'poll-option-votes' }]
    ]
  },

  addNodeView () {
    return ({ node, HTMLAttributes }) => {
      let currentNode = node
      const container = document.createElement('div')
      container.classList.add('poll-option')

      const attrs = { ...HTMLAttributes }
      delete attrs.class

      const label = document.createElement('span')
      label.classList.add('poll-option-label')
      label.setAttribute('data-placeholder', 'Možnost')

      const votes = document.createElement('span')
      votes.classList.add('poll-option-votes')
      votes.textContent = ''

      container.append(label, votes)

      const syncAttributes = updatedNode => {
        applyAttributes(container, {
          ...attrs,
          'data-option-id': updatedNode.attrs.optionId || null
        })
        const isEmpty = updatedNode.content.size === 0 || updatedNode.textContent.trim() === ''
        label.classList.toggle('is-empty', isEmpty)
      }

      syncAttributes(currentNode)

      return {
        dom: container,
        contentDOM: label,
        ignoreMutation (mutation) {
          if (mutation.type === 'selection') { return false }
          return !container.contains(mutation.target) || mutation.target === container
        },
        update (updatedNode) {
          if (updatedNode.type !== currentNode.type) { return false }
          currentNode = updatedNode
          syncAttributes(updatedNode)
          return true
        }
      }
    }
  }
})

export const PollOptions = Node.create({
  name: 'pollOptions',
  group: 'block',
  content: 'pollOption+',
  defining: true,
  selectable: false,

  parseHTML () {
    return [
      { tag: 'div[data-poll-options]' }
    ]
  },

  renderHTML ({ HTMLAttributes }) {
    return ['div', mergeAttributes({ class: 'poll-options', 'data-poll-options': '' }, HTMLAttributes), 0]
  },

  addNodeView () {
    return ({ editor, node, getPos, HTMLAttributes }) => {
      let currentNode = node
      const container = document.createElement('div')
      container.classList.add('poll-options')
      const attrs = { ...HTMLAttributes }
      delete attrs.class
      applyAttributes(container, { ...attrs, 'data-poll-options': '' })

      const list = document.createElement('div')
      list.classList.add('poll-options-list')
      container.append(list)

      if (editor.isEditable) {
        const actions = document.createElement('div')
        actions.classList.add('poll-options-actions')

        const addButton = document.createElement('button')
        addButton.type = 'button'
        addButton.classList.add('poll-option-add')
        addButton.textContent = 'Přidat možnost'
        addButton.addEventListener('click', () => {
          if (typeof getPos !== 'function') { return }
          const pos = getPos()
          const insertPos = pos + currentNode.nodeSize - 1
          const optionNode = createPollOptionNode('')
          editor.chain().focus().insertContentAt(insertPos, optionNode, { updateSelection: true }).run()
        })

        actions.append(addButton)
        container.append(actions)
      }

      return {
        dom: container,
        contentDOM: list,
        ignoreMutation (mutation) {
          if (mutation.type === 'selection') { return false }
          return !container.contains(mutation.target) || mutation.target === container
        },
        update (updatedNode) {
          if (updatedNode.type !== currentNode.type) { return false }
          currentNode = updatedNode
          return true
        }
      }
    }
  }
})

export const PollQuestion = Node.create({
  name: 'pollQuestion',
  group: 'block',
  content: 'inline*',
  defining: true,
  selectable: false,

  parseHTML () {
    return [
      { tag: 'div[data-poll-question]' }
    ]
  },

  renderHTML ({ HTMLAttributes, node }) {
    const merged = mergeAttributes({ class: 'poll-question', 'data-poll-question': '' }, HTMLAttributes)
    merged['data-placeholder'] = merged['data-placeholder'] || 'Zadej otázku'
    if (node.content.size === 0) {
      merged.class = (merged.class || '') + ' is-empty'
    }
    return ['div', merged, 0]
  },

  addNodeView () {
    return ({ node, HTMLAttributes }) => {
      let currentNode = node
      const container = document.createElement('div')
      container.classList.add('poll-question')

      const attrs = { ...HTMLAttributes }
      delete attrs.class

      const syncAttributes = updatedNode => {
        const placeholder = attrs['data-placeholder'] || 'Zadej otázku'
        applyAttributes(container, {
          ...attrs,
          'data-poll-question': '',
          'data-placeholder': placeholder
        })
        const isEmpty = updatedNode.content.size === 0 || updatedNode.textContent.trim() === ''
        container.classList.toggle('is-empty', isEmpty)
      }

      syncAttributes(currentNode)

      return {
        dom: container,
        contentDOM: container,
        ignoreMutation (mutation) {
          if (mutation.type === 'selection') { return false }
          return !container.contains(mutation.target) || mutation.target === container
        },
        update (updatedNode) {
          if (updatedNode.type !== currentNode.type) { return false }
          currentNode = updatedNode
          syncAttributes(updatedNode)
          return true
        }
      }
    }
  }
})

export const Poll = Node.create({
  name: 'poll',
  group: 'block',
  content: 'pollQuestion pollOptions',
  defining: true,
  selectable: false,

  addAttributes () {
    return {
      pollId: {
        default: null,
        parseHTML: element => element.getAttribute('data-poll-id'),
        renderHTML: attributes => ({ 'data-poll-id': attributes.pollId })
      },
      multiple: {
        default: false,
        parseHTML: element => element.getAttribute('data-poll-multiple') === 'true',
        renderHTML: attributes => (attributes.multiple ? { 'data-poll-multiple': 'true' } : {})
      }
    }
  },

  parseHTML () {
    return [
      { tag: 'div[data-poll-id]' }
    ]
  },

  renderHTML ({ HTMLAttributes }) {
    const merged = mergeAttributes({ class: 'poll' }, HTMLAttributes)
    return ['div', merged, 0]
  },

  addNodeView () {
    return ({ node, editor, getPos, HTMLAttributes }) => {
      let currentNode = node
      const container = document.createElement('div')
      container.classList.add('poll')
      const attrs = { ...HTMLAttributes }
      delete attrs.class
      applyAttributes(container, attrs)

      const toolbar = document.createElement('div')
      toolbar.classList.add('poll-editor-toolbar')

      if (editor.isEditable) {
        const toggleLabel = document.createElement('label')
        toggleLabel.classList.add('poll-toggle')

        const toggle = document.createElement('input')
        toggle.type = 'checkbox'
        toggle.checked = Boolean(node.attrs.multiple)
        toggle.addEventListener('change', () => {
          if (typeof getPos !== 'function') { return }
          const attrs = { ...currentNode.attrs, multiple: toggle.checked }
          editor.chain().focus().command(({ tr, dispatch }) => {
            const pos = getPos()
            tr.setNodeMarkup(pos, undefined, attrs)
            dispatch(tr)
            return true
          }).run()
        })

        const toggleText = document.createElement('span')
        toggleText.textContent = 'Povolit více odpovědí'

        toggleLabel.append(toggle, toggleText)
        toolbar.append(toggleLabel)
      }

      const inner = document.createElement('div')
      inner.classList.add('poll-editor-inner')

      if (editor.isEditable) {
        container.append(toolbar)
      }
      container.append(inner)

      const syncAttributes = updatedNode => {
        applyAttributes(container, {
          ...attrs,
          'data-poll-id': updatedNode.attrs.pollId || null,
          'data-poll-multiple': updatedNode.attrs.multiple ? 'true' : null
        })
        const checkbox = toolbar.querySelector('input[type="checkbox"]')
        if (checkbox) {
          checkbox.checked = Boolean(updatedNode.attrs.multiple)
        }
      }

      syncAttributes(currentNode)

      return {
        dom: container,
        contentDOM: inner,
        ignoreMutation (mutation) {
          if (mutation.type === 'selection') { return false }
          return !container.contains(mutation.target) || mutation.target === container
        },
        update (updatedNode) {
          if (updatedNode.type !== currentNode.type) { return false }
          currentNode = updatedNode
          syncAttributes(updatedNode)
          return true
        }
      }
    }
  },

  addCommands () {
    return {
      insertPoll: ({ question, answers, pollId, multiple = false } = {}) => ({ chain }) => {
        const sanitizedQuestion = (question || '').trim()
        const sanitizedAnswers = Array.isArray(answers)
          ? answers.map(answer => answer.trim()).filter(Boolean)
          : []

        const defaultAnswers = sanitizedAnswers.length >= 2 ? sanitizedAnswers : ['', '']
        const questionText = sanitizedQuestion

        const id = pollId || generateId('poll')

        const optionsContent = defaultAnswers.map(answer => createPollOptionNode(answer))

        return chain().insertContent({
          type: 'poll',
          attrs: { pollId: id, multiple },
          content: [
            {
              type: 'pollQuestion',
              content: questionText ? [{ type: 'text', text: questionText }] : []
            },
            { type: 'pollOptions', content: optionsContent }
          ]
        }).run()
      }
    }
  }
})

export function createPoll (question, answers, { pollId, multiple } = {}) {
  const sanitizedQuestion = (question || '').trim()
  const sanitizedAnswers = Array.isArray(answers)
    ? answers.map(answer => answer.trim()).filter(Boolean)
    : []

  if (!sanitizedQuestion || sanitizedAnswers.length < 2) {
    return null
  }

  const id = pollId || generateId('poll')
  return {
    type: 'poll',
    attrs: { pollId: id, multiple: Boolean(multiple) },
    content: [
      { type: 'pollQuestion', content: [{ type: 'text', text: sanitizedQuestion }] },
      {
        type: 'pollOptions',
        content: sanitizedAnswers.map(answer => createPollOptionNode(answer))
      }
    ]
  }
}
