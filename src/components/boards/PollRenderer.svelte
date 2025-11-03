<script>
  import { tick } from 'svelte'

  const { user, contentEl, content } = $props()

  let polls = $state([])

  class PollState {
    pollId = ''
    question = ''
    isMultiple = false
    options = []
    counts = $state({})
    total = $state(0)
    selected = $state([])
    loading = $state(false)

    constructor (pollId, question, isMultiple, options) {
      this.pollId = pollId
      this.question = question
      this.isMultiple = isMultiple
      this.options = options
    }

    get hasVotes () {
      return this.total > 0
    }

    getPercentage (optionId) {
      if (this.total === 0) return 0
      const count = this.counts[optionId] || 0
      return Math.round((count / this.total) * 100)
    }

    isSelected (optionId) {
      return this.selected.includes(optionId)
    }

    formatTotal () {
      if (this.total === 0) return 'Zatím nikdo nehlasoval'
      const abs = Math.abs(this.total)
      let label = 'hlasů'
      if (abs === 1) label = 'hlas'
      else if (abs >= 2 && abs <= 4) label = 'hlasy'
      return `${this.total} ${label}`
    }

    async loadState () {
      try {
        const res = await fetch(`/api/board/poll?pollId=${encodeURIComponent(this.pollId)}`)
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Nepodařilo se načíst výsledky ankety')
        }
        this.counts = data.counts || {}
        this.total = data.total || 0
        this.selected = Array.isArray(data.userVotes) ? data.userVotes : []
      } catch (error) {
        console.error(error)
      }
    }

    async vote (optionId) {
      if (!optionId || !user?.id) {
        if (!user?.id) {
          window.showError?.('Pro hlasování se přihlas.')
        }
        return
      }
      this.loading = true
      try {
        const res = await fetch('/api/board/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollId: this.pollId, optionId })
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Nepodařilo se uložit hlas')
        }
        this.counts = data.counts || {}
        this.total = data.total || 0
        this.selected = Array.isArray(data.userVotes) ? data.userVotes : []
      } catch (error) {
        console.error(error)
        window.showError?.(error.message || 'Nepodařilo se uložit hlas')
      } finally {
        this.loading = false
      }
    }
  }

  function extractPolls () {
    if (!contentEl || typeof window === 'undefined') return []

    const pollElements = contentEl.querySelectorAll('[data-poll-id]')
    const extracted = []

    pollElements.forEach(pollEl => {
      const pollId = pollEl.getAttribute('data-poll-id')
      if (!pollId) return

      const questionEl = pollEl.querySelector('.poll-question')
      const question = questionEl?.textContent || ''
      const isMultiple = pollEl.getAttribute('data-poll-multiple') === 'true'

      const optionElements = Array.from(pollEl.querySelectorAll('[data-option-id]'))
      const options = optionElements.map(optionEl => ({
        id: optionEl.getAttribute('data-option-id'),
        label: optionEl.querySelector('.poll-option-label')?.textContent || ''
      })).filter(opt => opt.id)

      if (options.length > 0) {
        // Hide the original poll element
        pollEl.style.display = 'none'

        const poll = new PollState(pollId, question, isMultiple, options)
        extracted.push(poll)
        poll.loadState()
      }
    })

    return extracted
  }

  $effect(() => {
    if (contentEl) {
      content // eslint-disable-line no-unused-expressions
      tick().then(() => {
        polls = extractPolls()
      })
    }
  })
</script>
{#each polls as poll (poll.pollId)}
  <div class="poll" class:poll-loading={poll.loading} class:poll-has-votes={poll.hasVotes} class:poll-is-multiple={poll.isMultiple}>
    {#if poll.question}
      <div class="poll-question">{poll.question}</div>
    {/if}
    <div class="poll-options" role={poll.isMultiple ? 'group' : 'radiogroup'}>
      {#each poll.options as option (option.id)}
        {@const selected = poll.isSelected(option.id)}
        {@const percentage = poll.getPercentage(option.id)}
        {@const count = poll.counts[option.id] || 0}
        <button
          class="poll-option plain"
          class:selected
          style="--poll-progress: {percentage}%"
          role={poll.isMultiple ? 'checkbox' : 'radio'}
          aria-checked={selected}
          disabled={poll.loading}
          onclick={() => poll.vote(option.id)}
        >
          <span class="poll-option-label">{option.label}</span>
          <span class="poll-option-votes">
            {#if poll.hasVotes}
              {count} · {percentage}%
            {:else}
              Hlasuj
            {/if}
          </span>
        </button>
      {/each}
    </div>
    <div class="poll-total">{poll.formatTotal()}</div>
  </div>
{/each}

<style>
  .poll {
    margin: 15px 0;
    padding: 18px;
    border-radius: 8px;
    background: var(--blockLight);
    position: relative;
  }

  .poll-question {
    font-weight: 600;
    margin-bottom: 14px;
    font-size: 1.05em;
  }

  .poll-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .poll-option {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px 14px 45px;
    border-radius: 6px;
    cursor: pointer;
    background: var(--overlay);
    text-align: left;
    width: 100%;
  }

  .poll-option::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 50%;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    transform: translateY(-50%);
    background: var(--panel);
    z-index: 1;
  }

  .poll-is-multiple .poll-option::before {
    border-radius: 6px;
  }

  .poll-option::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 6px;
    width: var(--poll-progress, 0%);
    max-width: 100%;
    background: var(--accent);
    opacity: 0.2;
    pointer-events: none;
    transition: width 0.25s ease;
  }

  .poll-option-label,
  .poll-option-votes {
    position: relative;
    z-index: 2;
  }

  .poll-option-label {
    display: block;
    flex: 1;
    font-weight: 500;
  }

  .poll-option-votes {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 96px;
    text-align: right;
    font-size: 0.82em;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
  }

  .poll-option:hover:not(:disabled) {
    background: var(--overlay);
    transform: translateY(-1px);
  }

  .poll-option.selected::before {
    background: var(--accent);
  }

  .poll-option:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--buttonBg), transparent 45%);
    outline-offset: 3px;
  }

  .poll-loading .poll-option {
    opacity: 0.75;
  }

  .poll-has-votes .poll-option-votes {
    opacity: 0.85;
    text-transform: none;
    font-weight: 500;
  }

  .poll:not(.poll-has-votes) .poll-option-votes {
    text-transform: uppercase;
    font-weight: 600;
    opacity: 0.6;
  }

  .poll-total {
    margin-top: 16px;
    text-align: right;
    font-size: 0.85em;
    opacity: 0.75;
  }
</style>
