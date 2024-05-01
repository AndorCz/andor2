// Temporary test

import { TextStyle } from '@tiptap/extension-text-style'

export const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => element.style.color,
        renderHTML: attributes => attributes.color ? { style: `color: ${attributes.color}` } : {},
      },
      fontFamily: {
        default: null,
        parseHTML: element => element.style.fontFamily,
        renderHTML: attributes => attributes.fontFamily ? { style: `font-family: ${attributes.fontFamily}` } : {},
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[style]',
        getAttrs: node => ({
          color: node.style.color,
          fontFamily: node.style.fontFamily
        }),
      },
      {
        tag: 'b[style]',
        getAttrs: node => ({
          color: node.style.color,
          fontFamily: node.style.fontFamily
        }),
      },
      // Extend to other tags as needed
    ];
  }
});
