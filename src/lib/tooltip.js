import tippy from 'tippy.js'

// Simple wrapper around Tippy that shows title prop as a tooltip
export function tooltip (node, params = {}) {
  const getTitle = () => node.getAttribute('title')
  let content = params.content || getTitle()

  node.removeAttribute('title') // clear out the HTML title attribute since we don't want the default behavior of it showing up on hover.

  const tip = tippy(node, { content, ...params }) // support any of the Tippy props by forwarding all 'params'

  const observer = new MutationObserver(() => {
    const newTitle = getTitle()
    if (newTitle !== content) {
      content = newTitle
      tip.setProps({ content })
    }
  })

  observer.observe(node, { attributes: true, attributeFilter: ['title'] })

  return {
    update: (newParams) => tip.setProps({ content: newParams.content || getTitle(), ...newParams }), // if the props change, let's update the Tippy instance
    destroy: () => {
      tip.destroy() // clean up the Tippy instance on unmount
      observer.disconnect()
    }
  }
}

// Wrapper around Tippy that shows content of the node as a tooltip instead
export function tooltipContent (node, params = {}) {
  const tip = tippy(node, { content: node.firstChild, allowHTML: true, interactive: true, ...params })
  return {
    update: (newParams) => tip.setProps({ content: node.firstChild, allowHTML: true, interactive: true, ...newParams }),
    destroy: () => tip.destroy()
  }
}
