<script>
  import DOMPurify from 'dompurify'
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { formatDate } from '@lib/utils'
  import { lightboxImage } from '@lib/stores'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import Reactions from '@components/common/Reactions.svelte'
  import PollRenderer from '@components/boards/PollRenderer.svelte'

  const { post, user = null, unread = false, isMyPost = false, allowReactions = false, allowedReactions = ['frowns', 'laughs', 'shocks', 'hearts', 'thumbs'], canDeleteAll = false, canModerate = false, onModerate = null, onDelete = null, onEdit = null, onReply = null, iconSize = 70, showEdited = true } = $props()

  let expanded = $state(false)
  let contentEl = $state()
  let iconEl = $state()
  let portraitEl = $state()
  let rewardEl = $state()
  const canDelete = canDeleteAll || (post.dice ? canDeleteAll : isMyPost)

  onMount(() => {
    checkMeMentioned()
    positionReward()
    window.addEventListener('resize', positionReward)
    return () => {
      window.removeEventListener('resize', positionReward)
    }
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
      console.log('effectiveHeight', effectiveHeight)
      rewardEl.style.top = `${effectiveHeight - 35}px`
    }
  }

  $effect(() => {
    // trigger reinitialization when post content changes
    // eslint-disable-next-line no-unused-expressions
    post.content
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
    {#if $platform === 'desktop' && post.owner_reward_icon}<a href={post.owner_reward_link || '#'} target='_blank' class='reward' bind:this={rewardEl}><img src={post.owner_reward_icon} /></a>{/if}
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
          {#if post.owner_reward_icon}<a href={post.owner_reward_link || '#'} target='_blank' class='reward' bind:this={rewardEl}><img src={post.owner_reward_icon} /></a>{/if}
        </div>
      {/if}
      {@html DOMPurify.sanitize(post.content, { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })}
      <PollRenderer {user} {contentEl} content={post.content} />
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
        width: 30px;
        height: 30px;
        left: unset;
      }
  }
</style>
