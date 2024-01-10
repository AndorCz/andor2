
import tippy from 'tippy.js'

export function tooltip (node, params = {}) {
  const custom = params.content
  const title = node.title
  const content = custom || title

  node.title = '' // clear out the HTML title attribute since we don't want the default behavior of it showing up on hover.

  const tip = tippy(node, { content, ...params }) // support any of the Tippy props by forwarding all 'params'

  return {
    update: (newParams) => tip.setProps({ content, ...newParams }), // if the props change, let's update the Tippy instance
    destroy: () => tip.destroy() // clean up the Tippy instance on unmount
  }
}
