import { Notyf } from 'notyf'
import { removeURLParam } from '@lib/utils'
import 'notyf/notyf.min.css'

export const initToasts = () => {
  window.notyf = new Notyf({
    duration: 10000,
    position: { x: 'center', y: 'top' },
    ripple: false,
    types: [
      { type: 'success', className: 'success', background: 'var(--maximum)', icon: false, dismissible: true },
      { type: 'error', className: 'error', background: 'var(--error)', icon: false, duration: 99999, dismissible: true }
    ]
  })
  window.showSuccess = (text, duration = 3000) => {
    window.notyf.success({ message: text, duration })
  }
  window.showError = (text, duration = 20000) => {
    console.error(text)
    window.notyf.error({ message: text, duration })
  }
}

export const lookForToast = () => {
  setTimeout(() => {
    const { toastType, toastText } = Object.fromEntries(new URLSearchParams(window.location.search))
    if (toastType && toastText) {
      switch (toastType) {
        case 'success': window.showSuccess(toastText); break
        case 'error': window.showError(toastText); break
      }
      removeURLParam('toastType')
      removeURLParam('toastText')
    }
  }, 100)
}

export const showSuccess = (text, duration = 2000) => {
  if (window) { window.notyf.success({ message: text, duration }) }
}

export const showError = (text, duration = 10000) => {
  if (window) { window.notyf.success({ message: text, duration }) }
}
