<script>
  import DOMPurify from 'dompurify'
  import { onMount, onDestroy, tick } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { formatDate } from '@lib/utils'
  import { lightboxImage } from '@lib/stores'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import Reactions from '@components/common/Reactions.svelte'

  const { post, user = null, unread = false, isMyPost = false, allowReactions = false, allowedReactions = ['frowns', 'laughs', 'shocks', 'hearts', 'thumbs'], canDeleteAll = false, canModerate = false, onModerate = null, onDelete = null, onEdit = null, onReply = null, iconSize = 70, showEdited = true } = $props()

  let expanded = $state(false)
  let contentEl = $state()
  let iconEl = $state()
  let portraitEl = $state()
  let rewardEl = $state()
  let pollControllers = []
  let pollsMounted = false
  const canDelete = canDeleteAll || (post.dice ? canDeleteAll : isMyPost)

  onMount(() => {
    checkMeMentioned()
    positionReward()
    window.addEventListener('resize', positionReward)
    pollsMounted = true
    setupPolls()
    return () => {
      window.removeEventListener('resize', positionReward)
    }
  })

  onDestroy(() => {
    clearPollControllers()
    pollsMounted = false
  })

  function onHeaderClick () {
    if (post.moderated) { expanded = !expanded }
  }

  async function triggerModerate () {
    if (onModerate) {
      const isConfirmed = await onModerate(post.id)
      if (isConfirmed) { post.moderated = true }
    }
  }

  function onImageClick (event) {
    // exclude reaction buttons
    if (event.target.tagName === 'IMG' && !event.target.classList.contains('svg')) { $lightboxImage = event.target.src }
  }

  async function toggleImportant () {
    const important = !post.important
    post.important = important
    const { error } = await supabase.from('posts').update({ important }).eq('id', post.id)
    if (error) { return handleError(error) }
  }

  function checkMeMentioned () {
    const mentions = contentEl.querySelectorAll('.mention')
    mentions.forEach(mention => {
      if (mention.textContent === '@' + user.name) { mention.classList.add('highlight') }
    })
    const replies = contentEl.querySelectorAll('cite')
    replies.forEach(reply => {
      if (reply.textContent === user.name + ':') { reply.classList.add('highlight') }
    })
  }

  function positionReward () {
    if ($platform === 'desktop' && iconEl && portraitEl && rewardEl) {
      const iconHeight = iconEl.offsetHeight
      const portraitHeight = portraitEl.offsetHeight
      const effectiveHeight = Math.min(portraitHeight, iconHeight)
      rewardEl.style.top = `${effectiveHeight - 35}px`
    }
  }

  function clearPollControllers () {
    pollControllers.forEach(controller => controller.destroy?.())
    pollControllers = []
  }

  async function setupPolls () {
    if (!pollsMounted || typeof window === 'undefined') { return }
    await tick()
    if (!contentEl) { return }
    clearPollControllers()
    const pollElements = contentEl.querySelectorAll('[data-poll-id]')
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

  $effect(() => {
    if (!pollsMounted) { return }
    // trigger reinitialization when post content changes
    // eslint-disable-next-line no-unused-expressions
    post.content
    setupPolls()
  })
</script>

<div onclick={onImageClick} class={'post ' + $platform} class:moderated={post.moderated} class:hidden={post.moderated && !expanded} class:unread={unread} class:whispered={post.audience_names} class:important={post.important}>
  {#if $platform === 'desktop'}
    <div class='icon' style='--iconSize: {iconSize}px' bind:this={iconEl}>
      {#if post.owner_portrait}
        <img src={getPortraitUrl(post.owner, post.owner_portrait)} class='portrait' alt={post.owner_name} bind:this={portraitEl} />
      {:else if post.owner_type === 'character'}
        <img src='/default_char.jpg' class='portrait' alt={post.owner_name} bind:this={portraitEl} />
      {:else}
        <img src='/default_user.jpg' class='portrait' alt={post.owner_name} bind:this={portraitEl} />
      {/if}
    </div>
  {/if}
  <div class='body'>
    {#if $platform === 'desktop' && post.owner_reward_icon}<a href={post.owner_reward_icon} target='_blank'><img src='/rewards/pumpkin.png' class='reward' bind:this={rewardEl} /></a>{/if}
    <div class='header'>
      {#if unread}
        <span class='badge'></span>
      {/if}
      <span class='title' onclick={onHeaderClick}>
        {#if post.owner_type === 'user'}
          <a href={'/user?id=' + post.owner} class='user'>{post.owner_name}</a>
        {:else}
          <a href={'/game/character?id=' + post.owner} class='character'>{post.owner_name}</a>
        {/if}
        {#if post.audience_names}
          <span class='audience'>jen pro: <b>{post.audience_names.join(', ')}</b></span>
        {/if}
      </span>
      <span class='toolbar'>
        <span class='time'>{formatDate(post.created_at)}</span>
        {#if canModerate}
          <button onclick={toggleImportant} class='material label' title={post.important ? 'Odebrat důležitost' : 'Přidat důležitost'} use:tooltip>label_important</button>
        {/if}
        {#if onEdit && isMyPost}
          <button onclick={() => onEdit(post)} class='material edit' title='Upravit' use:tooltip>edit</button>
        {/if}
        {#if onDelete && canDelete}
          <button onclick={() => onDelete(post)} class='material delete' title='Smazat' use:tooltip>delete</button>
        {/if}
        {#if canModerate && !post.moderated}
          <button onclick={triggerModerate} class='material moderate' title='Skrýt všem' use:tooltip>visibility_off</button>
        {/if}
        {#if onReply}
          <span class='sep'></span>
          <button onclick={() => { onReply(post.id, post.owner_name, post.owner) }} class='material reaction reply square' title='Reagovat' use:tooltip>reply</button>
        {/if}
      </span>
    </div>
    <div class='content' bind:this={contentEl}>
      {#if $platform === 'mobile'}
        <div class='icon' style='--iconSize: {iconSize}px'>
          {#if post.owner_portrait}
            <img src={getPortraitUrl(post.owner, post.owner_portrait)} class='portrait' alt={post.owner_name} />
          {:else if post.owner_type === 'character'}
            <img src='/default_char.jpg' class='portrait' alt={post.owner_name} />
          {:else}
            <img src='/default_user.jpg' class='portrait' alt={post.owner_name} />
          {/if}
          {#if post.owner_reward_icon}<a href={post.owner_reward_icon} target='_blank'><img src='/rewards/pumpkin.png' class='reward' bind:this={rewardEl} /></a>{/if}
        </div>
      {/if}
      {@html DOMPurify.sanitize(post.content, { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })}
      {#if showEdited}
        {#if post.created_at !== post.updated_at}<span class='edited'>(upraveno)</span>{/if}
      {/if}
      <div class='clear'></div>
      {#if allowReactions}
        <Reactions {user} {post} type='post' allowed={allowedReactions} />
      {/if}
    </div>
  </div>
  {#if post.illustration}
    <img src={post.illustration} alt='Illustration' title={post.prompt || ''} class='aside illustration' />
  {/if}
</div>

<style>
  .post {
    position: relative;
    display: flex;
    width: 100%;
    margin-top: 10px;
    padding-bottom: 10px;
    text-align: left;
    gap: 10px;
  }
    .moderated {
      opacity: 0.5;
      padding-top: 0px;
      padding-bottom: 0px;
    }
      .moderated .header {
        cursor: pointer;
      }
      .hidden .header {
        box-shadow: none;
        background-color: transparent;
      }

    .icon {
      width: var(--iconSize);
      overflow: hidden;
      cursor: pointer;
      position: relative;
    }
      .icon img {
        display: block;
      }
      .desktop .icon .portrait {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        display: block;
      }
      .mobile .icon {
        border: 1px solid var(--panel);
        float: left;
        margin-right: 15px;
        margin-bottom: 5px;
      }
      .badge {
        top: 0px;
        left: 0px;
      }

  .body {
    flex: 1;
    overflow: hidden;
  }

  .poll {
    margin: 15px 0;
    padding: 18px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--panel), #000 12%);
    background: color-mix(in srgb, var(--panel), transparent 35%);
    position: relative;
    box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.5);
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
      padding: 14px 18px 14px 60px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--panel), #000 20%);
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      background: color-mix(in srgb, var(--panel), transparent 65%);
      overflow: hidden;
    }
      .poll-option::before {
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
      .poll-is-multiple .poll-option::before {
        border-radius: 6px;
      }
      .poll-option::after {
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
      .poll-option .poll-option-label,
      .poll-option .poll-option-votes {
        position: relative;
        z-index: 2;
      }
      .poll-option .poll-option-label {
        display: block;
        flex: 1;
        font-weight: 500;
      }
      .poll-option .poll-option-votes {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 96px;
        text-align: right;
        font-size: 0.82em;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.04em;
      }
      .poll-option:hover {
        border-color: color-mix(in srgb, var(--buttonBg), transparent 20%);
        transform: translateY(-1px);
        box-shadow: 0 12px 24px -22px color-mix(in srgb, var(--buttonBg), #000 65%);
      }
      .poll-option.selected {
        border-color: var(--buttonBg);
        box-shadow: 0 12px 28px -18px color-mix(in srgb, var(--buttonBg), transparent 50%);
      }
      .poll-option.selected::before {
        background: var(--buttonBg);
        border-color: var(--buttonBg);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--buttonBg), transparent 55%);
      }
      .poll-option:focus {
        outline: 3px solid color-mix(in srgb, var(--buttonBg), transparent 45%);
        outline-offset: 3px;
      }
      .poll-loading .poll-option {
        pointer-events: none;
        opacity: 0.75;
      }
      .poll-has-votes .poll-option .poll-option-votes {
        opacity: 0.85;
        text-transform: none;
        font-weight: 500;
      }
      .poll:not(.poll-has-votes) .poll-option .poll-option-votes {
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
    .content {
      background-color: var(--block);
      overflow-wrap: anywhere;
      /* box-shadow: 2px 2px 3px #0002; */
    }
      .hidden .content, .hidden .toolbar, .hidden .icon, .hidden .time, .hidden .reply {
        display: none;
      }
    .header {
      position: relative;
      width: 100%;
      min-height: 50px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      /*
      background-color: color-mix(in srgb, var(--block), var(--panel) 50%);
      box-shadow: 2px 2px 3px #0002;
      */
      border-bottom: 1px var(--panel) solid;
      background-color: var(--block);
      padding: 5px 15px;
      color: var(--dim);
    }
      .whispered .content, .whispered .header {
        background-color: var(--whisper);
      }
      .header button {
        background: none;
        border: none;
        box-shadow: none;
        color: var(--dim);
      }
      .title {
        flex: 1;
      }
      .time {
        font-family: arial, sans-serif;
        font-size: 14px;
        opacity: 0.7;
        margin-right: 5px;
      }
      .audience {
        font-size: 15px;
        padding-left: 5px;
        color: var(--character);
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
      }
        .delete, .edit, .moderate, .label {
          padding: 5px;
          font-size: 19px;
          cursor: pointer;
          opacity: 0.7;
        }
        .reply {
          opacity: 0.7;
        }
          .time:hover, .delete:hover, .edit:hover, .moderate:hover, .reply:hover {
            opacity: 1;
            color: var(--text);
          }
    .clear {
      clear: both;
    }

    .important .content, .important .header {
      background-color: var(--prominent);
    }
    .important div.body {
      border-left: 5px solid var(--linkVisited);
    }
    .edited {
      font-size: 12px;
      color: var(--dim);
    }
    .illustration {
      object-fit: contain;
    }
    .iconBottom {
      border: 1px red solid;
    }
    .reward {
      position: absolute;
      left: 40px;
      width: 50px;
      height: 50px;
      z-index: 99;
      transition: transform 0.2s ease-in-out;
    }
      .reward:hover {
        transform: scale(1.1);
        filter: brightness(1.2);
      }

  @media (max-width: 860px) {
    .post {
      gap: 0px;
    }
    .toolbar {
      gap: 5px;
    }
    .sep {
      display: none;
    }
    .header {
      display: block;
      padding: 10px 10px 5px 10px;
      padding-left: 15px;
    }
      .reaction {
        padding: 0px 5px;
      }
      .toolbar {
        width: 100%;
        display: flex;
      }
        .toolbar .time {
          flex: 1;
        }
    .content {
      padding: 15px;
    }
  }
  @media (max-width: 500px) {
    .illustration {
      max-width: 20%;
    }
    .icon {
      position: relative;
      overflow: visible;
    }
      .reward {
        position: absolute;
        bottom: -10px;
        right: -10px;
        left: unset;
      }
  }
</style>
