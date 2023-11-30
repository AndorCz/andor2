
import { Notyf } from 'notyf'
import 'notyf/notyf.min.css'

export const notyf = new Notyf({
  duration: 5000,
  position: { x: 'right', y: 'top' },
  types: [
    { type: 'success', background: 'var(--green)', icon: false },
    { type: 'error', background: 'var(--error)', icon: false }
  ]
})

export const lookForToast = () => {
  const url = new URL(window.location.href)
  const toastType = url.searchParams.get('toastType')
  const toastText = url.searchParams.get('toastText')
  if (toastType && toastText) {
    switch (toastType) {
      case 'success': notyf.success(toastText); break
      case 'error': notyf.error(toastText); break
    }
    url.searchParams.delete('toastType')
    url.searchParams.delete('toastText')
    window.history.pushState({}, '', url.href)
  }
}

export const showSuccess = (text) => { notyf.success(text) }
export const showError = (text) => { notyf.error(text) }
