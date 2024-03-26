
import { Notyf } from 'notyf'
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
    console.log(text)
    window.notyf.success(text)
  }
  window.showError = (text) => {
    console.error(text)
    window.notyf.error(text)
  }
}

export const lookForToast = () => {
  setTimeout(() => {
    const url = new URL(window.location.href)
    const toastType = url.searchParams.get('toastType')
    const toastText = url.searchParams.get('toastText')
    if (toastType && toastText) {
      switch (toastType) {
        case 'success': window.showSuccess(toastText); break
        case 'error': window.showError(toastText); break
      }
      url.searchParams.delete('toastType')
      url.searchParams.delete('toastText')
      window.history.pushState({}, '', url.href)
    }
  }, 100)
}

export const showSuccess = (text) => {
  if (window) { window.notyf.success(text) }
}

export const showError = (text) => {
  if (window) { window.notyf.error(text) }
}
