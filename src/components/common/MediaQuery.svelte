<script context='module'>
  import { readable, derived } from 'svelte/store'

  export const breakpoint = readable('l', set => {
    const breakpoints = [
      { value: 'mobile', mediaquery: window.matchMedia('(max-width:  720px)') },
      { value: 'desktop', mediaquery: window.matchMedia('(min-width: 720px)') }
    ]

    for (const key in breakpoints) {
      const breakpoint = breakpoints[key]
      // set the current breakpoint
      if (breakpoint.mediaquery.matches === true) {
        set(breakpoint.value)
      }
      breakpoint.mediaquery.addEventListener('change', (event) => {
        if (event.matches === true) {
          set(breakpoint.value)
        }
      })
    }
  })

  export const platform = derived(breakpoint, $breakpoint => {
    return $breakpoint
  })

  export const orientation = readable('landscape', set => {
    const orientations = [
      { value: 'portrait', mediaquery: window.matchMedia('(orientation: portrait)') },
      { value: 'landscape', mediaquery: window.matchMedia('(orientation: landscape)') }
    ]

    for (const key in orientations) {
      const orientation = orientations[key]

      // set the current orientation
      if (orientation.mediaquery.matches === true) {
        set(orientation.value)
      }

      orientation.mediaquery.addEventListener('change', event => {
        if (event.matches === true) {
          set(orientation.value)
        }
      })
    }
  })
</script>
