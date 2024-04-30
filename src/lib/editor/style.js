// Temporary test

import { Extension } from '@tiptap/core'

export const CustomStyling = Extension.create({
  addGlobalAttributes () {
    return [
      {
        types: ['heading', 'paragraph', 'textStyle'],
        attributes: {
          color: {
            default: null,
            parseHTML: element => {
              return element.style.color ? { color: element.style.color } : null;
            },
            renderHTML: attributes => {
              if (attributes.color) {
                return { style: `color: ${attributes.color}` };
              }
              return {};
            },
          },
          fontFamily: {
            default: null,
            parseHTML: element => {
              return element.style.fontFamily ? { fontFamily: element.style.fontFamily } : null;
            },
            renderHTML: attributes => {
              if (attributes.fontFamily) {
                return { style: `font-family: ${attributes.fontFamily}` };
              }
              return {};
            },
          }
        },
      },
    ]
  },
});
