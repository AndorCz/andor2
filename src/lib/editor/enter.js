import { Extension } from '@tiptap/core'

export function EnterKeyHandler({ triggerSave, enterSend }) {
  return Extension.create({
    name: 'enterKeyHandler',
    addKeyboardShortcuts() {
      return {
        Enter: () => {
          const mentionPopup = document.querySelector('.tippy-box')
          if (mentionPopup) {
            const activeButton = mentionPopup.querySelector('.selected')
            if (activeButton) {
              activeButton.click()
              return true // Prevents default behavior
            }
          }

          if (enterSend) {
            if (!this.editor.isActive('code') && !event.shiftKey) {
              if (!this.editor.isEmpty) {
                triggerSave()
              }
              return true // Prevents the default enter behavior
            }
          }

          return false // Allows the default behavior (new line) when Shift is pressed
        }
      }
    }
  })
}
