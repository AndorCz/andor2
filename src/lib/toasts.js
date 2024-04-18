
import { Notyf } from 'notyf'
import { removeURLParam } from '@lib/utils'
import 'notyf/notyf.min.css'

export const initToasts = () => {
  window.notyf = new Notyf({
    duration: 10000,
    position: { x: 'center', y: 'top' },
    ripple: false,
    types: [
      { type: 'success', className: 'success', background: 'var(--maximum)', icon: false },
      { type: 'error', className: 'error', background: 'var(--error)', icon: false, duration: 99999, dismissible: true }
    ]
  })
  window.showSuccess = (text) => {
    window.notyf.success(text)
  }
  window.showError = (text) => {
    console.error(text)
    window.notyf.error(text)
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

export const showSuccess = (text) => {
  if (window) { window.notyf.success(text) }
}

export const showError = (text) => {
  if (window) { window.notyf.error(text) }
}
