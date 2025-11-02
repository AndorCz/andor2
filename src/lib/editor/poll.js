import { Node, mergeAttributes } from '@tiptap/core'

function generateId (prefix = 'poll') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`
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

  renderHTML ({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ class: 'poll-option' }, HTMLAttributes),
      ['span', { class: 'poll-option-label' }, 0],
      ['span', { class: 'poll-option-votes' }]
    ]
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

  renderHTML ({ HTMLAttributes }) {
    return ['div', mergeAttributes({ class: 'poll-question', 'data-poll-question': '' }, HTMLAttributes), 0]
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
    return ['div', mergeAttributes({ class: 'poll' }, HTMLAttributes), 0]
  },

  addCommands () {
    return {
      insertPoll: ({ question, answers, pollId, multiple = false } = {}) => ({ chain }) => {
        const sanitizedQuestion = (question || '').trim()
        const sanitizedAnswers = Array.isArray(answers)
          ? answers.map(answer => answer.trim()).filter(Boolean)
          : []

        if (!sanitizedQuestion) { return false }
        if (sanitizedAnswers.length < 2) { return false }

        const id = pollId || generateId('poll')

        const optionsContent = sanitizedAnswers.map(answer => ({
          type: 'pollOption',
          attrs: { optionId: generateId('poll-option') },
          content: [{ type: 'text', text: answer }]
        }))

        return chain().insertContent({
          type: 'poll',
          attrs: { pollId: id, multiple },
          content: [
            { type: 'pollQuestion', content: [{ type: 'text', text: sanitizedQuestion }] },
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
        content: sanitizedAnswers.map(answer => ({
          type: 'pollOption',
          attrs: { optionId: generateId('poll-option') },
          content: [{ type: 'text', text: answer }]
        }))
      }
    ]
  }
}
