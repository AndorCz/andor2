<script>
  import DOMPurify from 'dompurify'
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { formatDate } from '@lib/utils'
  import { lightboxImage } from '@lib/stores'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import Reactions from '@components/common/Reactions.svelte'

  const { post, user = null, unread = false, isMyPost = false, allowReactions = false, canDeleteAll = false, canModerate = false, onModerate = null, onDelete = null, onEdit = null, onReply = null, iconSize = 70, showEdited = true } = $props()

  let expanded = $state(false)
  let contentEl = $state()
  const canDelete = canDeleteAll || (post.dice ? canDeleteAll : isMyPost)

  onMount(() => {
    checkMeMentioned()
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
</script>

<div onclick={onImageClick} class={'post ' + $platform} class:moderated={post.moderated} class:hidden={post.moderated && !expanded} class:unread={unread} class:whispered={post.audience_names} class:important={post.important}>
  {#if $platform === 'desktop'}
    <div class='icon' style='--iconSize: {iconSize}px'>
      {#if post.owner_portrait}
        <img src={getPortraitUrl(post.owner, post.owner_portrait)} class='portrait' alt={post.owner_name} />
      {:else if post.owner_type === 'character'}
        <img src='/default_char.jpg' class='portrait' alt={post.owner_name} />
      {:else}
        <img src='/default_user.jpg' class='portrait' alt={post.owner_name} />
      {/if}
    </div>
  {/if}
  <div class='body'>
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
        </div>
      {/if}
      {@html DOMPurify.sanitize(post.content, { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })}
      {#if showEdited}
        {#if post.created_at !== post.updated_at}<span class='edited'>(upraveno)</span>{/if}
      {/if}
      <div class='clear'></div>
      {#if allowReactions}
        <Reactions {user} {post} type='post' />
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
      .desktop .icon img {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        display: block;
      }
      .mobile .icon {
        border: 1px solid var(--panel);
        float: left;
        /*
        margin-top: -16px;
        margin-left: -15px;
        */
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
</style>
