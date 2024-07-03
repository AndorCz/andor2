import Color from '@tiptap/extension-color'

// rgbStyleToHex
// from https://stackoverflow.com/a/3627747/5433572
// and https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

function rgbStyleToHex (color) {
  if (!color || color.indexOf('rgb') < 0) return color

  if (color.charAt(0) === '#') return color

  const nums = /(.*?)rgb\((\d+),\s*(\d+),\s*(\d+)\)/i.exec(color)
  const r = parseInt(nums[2], 10).toString(16)
  const g = parseInt(nums[3], 10).toString(16)
  const b = parseInt(nums[4], 10).toString(16)

  return ('#' + ((r.length === 1 ? '0' + r : r) + (g.length === 1 ? '0' + g : g) + (b.length === 1 ? '0' + b : b))).toUpperCase()
}

export const CustomColor = Color.extend({
  addGlobalAttributes () {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: element => rgbStyleToHex(element.style.color?.replace(/['"]+/g, '')),
            renderHTML: attributes => {
              if (!attributes.color) { return {} }
              return { style: `color: ${rgbStyleToHex(attributes.color)}` }
            }
          },
          backgroundColor: {
            default: null,
            parseHTML: element => rgbStyleToHex(element.style.backgroundColor?.replace(/['"]+/g, '')),
            renderHTML: attributes => {
              if (!attributes.backgroundColor) { return {} }
              return { style: `background-color: ${rgbStyleToHex(attributes.backgroundColor)}` }
            }
          }
        }
      }
    ]
  },

  addCommands () {
    return {
      ...this.parent?.(),
      setBgColor: backgroundColor => ({ chain }) => {
        return chain().setMark('textStyle', { backgroundColor }).run()
      },
      unsetBgColor: () => ({ chain }) => {
        return chain().setMark('textStyle', { backgroundColor: null }).removeEmptyTextStyle().run()
      }
    }
  }
})
