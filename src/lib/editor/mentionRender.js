import tippy from 'tippy.js'
import MentionList from '@components/common/MentionList.svelte'

export const MentionRender = (props) => {
  let component, popup, container

  return {
    onStart: props => {
      container = document.createElement('div') // container for the Svelte component
      container.tabIndex = -1
      component = new MentionList({
        target: container,
        props: { ...props, onClose: () => { popup[0].hide() } }
      })

      if (props.clientRect) {
        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: container,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          onHide: () => { props.editor.view.focus() }
        })
      }
    },

    onUpdate: (props) => { // update props
      component.$set({ items: props.items, command: props.command })
      if (props.clientRect && popup) { // update tippy
        popup[0].setProps({ getReferenceClientRect: props.clientRect })
      }
    },

    onExit: () => { // cleanup
      if (popup) { popup[0].destroy() }
      if (component) { component.$destroy() }
      if (container) { container.remove() }
    }
  }
}
