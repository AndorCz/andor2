<script>
  import { onMount, onDestroy, tick } from 'svelte'

  export let user
  export let contentEl
  export let content

  let pollControllers = []
  let pollsMounted = false
  let setupQueued = false

  function clearPollControllers () {
    pollControllers.forEach(controller => controller.destroy?.())
    pollControllers = []
  }

  async function queueSetup () {
    if (!pollsMounted || setupQueued || typeof window === 'undefined') { return }
    setupQueued = true
    await tick()
    setupQueued = false
    if (!pollsMounted || !contentEl) { return }
    initializePolls()
  }

  function initializePolls () {
    clearPollControllers()
    const pollElements = contentEl?.querySelectorAll?.('[data-poll-id]')
    if (!pollElements || pollElements.length === 0) { return }
    pollElements.forEach(pollEl => {
      const controller = createPollController(pollEl)
      pollControllers.push(controller)
      controller.init?.()
    })
  }

  function createPollController (pollEl) {
    const pollId = pollEl.getAttribute('data-poll-id')
    if (!pollId) {
      return { init () {}, destroy () {} }
    }

    const isMultiple = pollEl.getAttribute('data-poll-multiple') === 'true'
    pollEl.classList.toggle('poll-is-multiple', isMultiple)
    pollEl.setAttribute('role', isMultiple ? 'group' : 'radiogroup')

    let totalEl = pollEl.querySelector('.poll-total')
    if (!totalEl) {
      totalEl = document.createElement('div')
      totalEl.className = 'poll-total'
      pollEl.appendChild(totalEl)
    }

    const optionElements = Array.from(pollEl.querySelectorAll('[data-option-id]'))
    if (optionElements.length === 0) {
      return { init () {}, destroy () {} }
    }

    optionElements.forEach(optionEl => {
      optionEl.classList.add('poll-option-interactive')
      optionEl.setAttribute('tabindex', '0')
      optionEl.setAttribute('role', isMultiple ? 'checkbox' : 'radio')
      optionEl.setAttribute('aria-checked', 'false')
      optionEl.style.setProperty('--poll-progress', '0%')
    })

    const state = {
      counts: {},
      total: 0,
      selected: []
    }

    const listeners = optionElements.map(optionEl => {
      const optionId = optionEl.getAttribute('data-option-id')
      const handleClick = () => vote(optionId)
      const handleKeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          vote(optionId)
        }
      }
      optionEl.addEventListener('click', handleClick)
      optionEl.addEventListener('keydown', handleKeydown)
      return () => {
        optionEl.removeEventListener('click', handleClick)
        optionEl.removeEventListener('keydown', handleKeydown)
      }
    })

    function updateTotals () {
      const hasVotes = state.total > 0
      pollEl.classList.toggle('poll-has-votes', hasVotes)
      optionElements.forEach(optionEl => {
        const optionId = optionEl.getAttribute('data-option-id')
        const count = state.counts[optionId] || 0
        const percentage = state.total > 0 ? Math.round((count / state.total) * 100) : 0
        const isSelected = state.selected.includes(optionId)
        optionEl.classList.toggle('selected', isSelected)
        optionEl.setAttribute('aria-checked', isSelected ? 'true' : 'false')
        optionEl.style.setProperty('--poll-progress', `${percentage}%`)
        const votesEl = optionEl.querySelector('.poll-option-votes')
        if (votesEl) {
          votesEl.textContent = hasVotes ? `${count} · ${percentage}%` : 'Hlasuj'
        }
      })
      totalEl.textContent = hasVotes ? formatTotal(state.total) : 'Zatím nikdo nehlasoval'
    }

    function formatTotal (total) {
      const abs = Math.abs(total)
      let label = 'hlasů'
      if (abs === 1) { label = 'hlas' }
      else if (abs >= 2 && abs <= 4) { label = 'hlasy' }
      return `${total} ${label}`
    }

    async function loadState () {
      try {
        const res = await fetch(`/api/board/poll?pollId=${encodeURIComponent(pollId)}`)
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Nepodařilo se načíst výsledky ankety')
        }
        state.counts = data.counts || {}
        state.total = data.total || 0
        state.selected = Array.isArray(data.userVotes) ? data.userVotes : []
        updateTotals()
      } catch (error) {
        console.error(error)
      }
    }

    async function vote (optionId) {
      if (!optionId) { return }
      if (!user?.id) {
        window.showError?.('Pro hlasování se přihlas.')
        return
      }
      pollEl.classList.add('poll-loading')
      try {
        const res = await fetch('/api/board/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollId, optionId })
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Nepodařilo se uložit hlas')
        }
        state.counts = data.counts || {}
        state.total = data.total || 0
        state.selected = Array.isArray(data.userVotes) ? data.userVotes : []
        updateTotals()
      } catch (error) {
        console.error(error)
        window.showError?.(error.message || 'Nepodařilo se uložit hlas')
      } finally {
        pollEl.classList.remove('poll-loading')
      }
    }

    return {
      init: () => {
        pollEl.classList.add('poll-ready')
        updateTotals()
        loadState()
      },
      destroy: () => {
        listeners.forEach(remove => remove())
      }
    }
  }

  onMount(() => {
    pollsMounted = true
    queueSetup()
  })

  onDestroy(() => {
    pollsMounted = false
    clearPollControllers()
  })

  $: if (pollsMounted) {
    // eslint-disable-next-line no-unused-expressions
    content
    queueSetup()
  }

  $: if (pollsMounted && contentEl) {
    queueSetup()
  }
</script>

<style>
  :global(.poll) {
    margin: 15px 0;
    padding: 18px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--panel), #000 12%);
    background: color-mix(in srgb, var(--panel), transparent 35%);
    position: relative;
    box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.5);
  }

  :global(.poll-question) {
    font-weight: 600;
    margin-bottom: 14px;
    font-size: 1.05em;
  }

  :global(.poll-options) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  :global(.poll-option) {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px 14px 60px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--panel), #000 20%);
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    background: color-mix(in srgb, var(--panel), transparent 65%);
    overflow: hidden;
  }

  :global(.poll-option::before) {
    content: '';
    position: absolute;
    left: 20px;
    top: 50%;
    width: 20px;
    height: 20px;
    border: 2px solid color-mix(in srgb, var(--text), transparent 50%);
    border-radius: 50%;
    transform: translateY(-50%);
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    background: var(--block);
    z-index: 1;
  }

  :global(.poll-is-multiple .poll-option::before) {
    border-radius: 6px;
  }

  :global(.poll-option::after) {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 14px;
    width: var(--poll-progress, 0%);
    max-width: 100%;
    background: color-mix(in srgb, var(--buttonBg), transparent 80%);
    opacity: 0.22;
    pointer-events: none;
    transition: width 0.25s ease;
  }

  :global(.poll-option .poll-option-label),
  :global(.poll-option .poll-option-votes) {
    position: relative;
    z-index: 2;
  }

  :global(.poll-option .poll-option-label) {
    display: block;
    flex: 1;
    font-weight: 500;
  }

  :global(.poll-option .poll-option-votes) {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 96px;
    text-align: right;
    font-size: 0.82em;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
  }

  :global(.poll-option:hover) {
    border-color: color-mix(in srgb, var(--buttonBg), transparent 20%);
    transform: translateY(-1px);
    box-shadow: 0 12px 24px -22px color-mix(in srgb, var(--buttonBg), #000 65%);
  }

  :global(.poll-option.selected) {
    border-color: var(--buttonBg);
    box-shadow: 0 12px 28px -18px color-mix(in srgb, var(--buttonBg), transparent 50%);
  }

  :global(.poll-option.selected::before) {
    background: var(--buttonBg);
    border-color: var(--buttonBg);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--buttonBg), transparent 55%);
  }

  :global(.poll-option:focus) {
    outline: 3px solid color-mix(in srgb, var(--buttonBg), transparent 45%);
    outline-offset: 3px;
  }

  :global(.poll-loading .poll-option) {
    pointer-events: none;
    opacity: 0.75;
  }

  :global(.poll-has-votes .poll-option .poll-option-votes) {
    opacity: 0.85;
    text-transform: none;
    font-weight: 500;
  }

  :global(.poll:not(.poll-has-votes) .poll-option .poll-option-votes) {
    text-transform: uppercase;
    font-weight: 600;
    opacity: 0.6;
  }

  :global(.poll-total) {
    margin-top: 16px;
    text-align: right;
    font-size: 0.85em;
    opacity: 0.75;
  }
</style>
