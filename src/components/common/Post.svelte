<script>
  import { supabase, handleError } from '@lib/database'
  import { writable } from 'svelte/store'
  import { Render } from 'svelte-purify'
  import { formatDate } from '@lib/utils'

  export let user
  export let post
  export let unread = false
  export let isMyPost = false
  export let allowReactions = false
  export let canDeleteAll = false
  export let canModerate = false
  export let onModerate = null
  export let onDelete = null
  export let onEdit = null
  export let onReply = null
  export let iconSize = 140

  const postStore = writable(post)
  let expanded = false

  const onHeaderClick = () => {
    if ($postStore.moderated) { expanded = !expanded }
  }

  function getMyReaction (reaction) {
    return $postStore[reaction].findIndex((id) => { return id === user.id })
  }

  function hasReacted (reaction) {
    return getMyReaction(reaction) > -1
  }

  function triggerModerate () {
    $postStore.moderated = true
    if (onModerate) { onModerate($postStore.id) }
  }

  async function toggleReaction (reaction) {
    // update database
    const { data, error } = await supabase.rpc('update_reaction', { post_id: $postStore.id, reaction_type: reaction, action: hasReacted(reaction) ? 'remove' : 'add' }).single()
    if (error) { return handleError(error) }
    $postStore.frowns = data.frowns
    $postStore.thumbs = data.thumbs
    $postStore.hearts = data.hearts
    $postStore.laughs = data.laughs
  }
</script>

<div class='post' class:moderated={$postStore.moderated} class:hidden={$postStore.moderated && !expanded} class:unread={unread}>
  {#if $postStore.owner_portrait}
    <div class='icon' style='--iconSize: {iconSize}px'>
      <img src={$postStore.owner_portrait} alt={$postStore.owner_name} />
    </div>
  {/if}
  <div class='body'>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class='header'>
      {#if unread}
        <span class='badge'></span>
      {/if}
      <span class='title' on:click={onHeaderClick}>
        <b>{$postStore.owner_name}</b>
        {#if $postStore.audience_names}
          <span class='audience'>jen pro: <b>{$postStore.audience_names.join(', ')}</b></span>
        {/if}
      </span>
      <span class='toolbar'>
        <span class='time'>{formatDate($postStore.created_at)}</span>
        {#if canDeleteAll || isMyPost}
          {#if onEdit}
            <button on:click={() => onEdit($postStore.id, $postStore.content)} class='material edit' title='Upravit'>edit</button>
          {/if}
          {#if onDelete}
            <button on:click={() => onDelete($postStore.id)} class='material delete' title='Smazat'>delete</button>
          {/if}
        {:else if canModerate && !$postStore.moderated}
          <button on:click={triggerModerate} class='material moderate' title='Skrýt všem'>visibility_off</button>
        {/if}
        {#if onReply}
          <span class='sep'></span>
          <button on:click={() => { onReply($postStore.id, $postStore.owner_name) }} class='material reaction reply' title='Reagovat'>reply</button>
        {/if}
      </span>
    </div>
    <div class='content'>
      <Render html={$postStore.content} />
      {#if allowReactions}
        {#if user.id}
          {#key $postStore}
            <span class='reactions'>
              <button on:click={() => { toggleReaction('frowns') }} class:active={hasReacted('frowns')} class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'>{#if $postStore.frowns.length}<span class='count'>{$postStore.frowns.length}</span>{/if}</button>
              <button on:click={() => { toggleReaction('laughs') }} class:active={hasReacted('laughs')} class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích'>{#if $postStore.laughs.length}<span class='count'>{$postStore.laughs.length}</span>{/if}</button>
              <button on:click={() => { toggleReaction('hearts') }} class:active={hasReacted('hearts')} class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'>{#if $postStore.hearts.length}<span class='count'>{$postStore.hearts.length}</span>{/if}</button>
              <button on:click={() => { toggleReaction('thumbs') }} class:active={hasReacted('thumbs')} class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'>{#if $postStore.thumbs.length}<span class='count'>{$postStore.thumbs.length}</span>{/if}</button>
            </span>
          {/key}
        {:else}
          <span class='reactions'>
            {#if $postStore.frowns.length}<span class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'><span class='count'>{$postStore.frowns.length}</span></span>{/if}
            {#if $postStore.laughs.length}<span class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích'><span class='count'>{$postStore.laughs.length}</span></span>{/if}
            {#if $postStore.hearts.length}<span class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'><span class='count'>{$postStore.hearts.length}</span></span>{/if}
            {#if $postStore.thumbs.length}<span class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'><span class='count'>{$postStore.thumbs.length}</span></span>{/if}
          </span>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .post {
    display: flex;
    width: 100%;
    padding-top: 10px;
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
    }
      .icon img {
        width: 100%;
        display: block;
        box-shadow: 2px 2px 3px #0002;
      }

  .body {
    flex: 1;
  }
    .content {
      background-color: var(--block);
      padding: 20px;
      box-shadow: 2px 2px 3px #0002;
    }
      .hidden .content, .hidden .toolbar, .hidden .icon, .hidden .reactions, .hidden .time, .hidden .reply {
        display: none;
      }
    .header {
      position: relative;
      width: 100%;
      min-height: 50px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: color-mix(in srgb, var(--block), var(--panel) 50%);
      padding: 5px 15px;
      box-shadow: 2px 2px 3px #0002;
      color: var(--dim);
    }
      .header button, .content button {
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
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
      }
        .delete, .edit, .moderate {
          padding: 5px;
          font-size: 19px;
          cursor: pointer;
          opacity: 0.7;
        }
          .time:hover, .delete:hover, .edit:hover, .moderate:hover {
            opacity: 1;
          }

      /* Reactions */
      .reactions {
        display: flex;
        margin-top: 20px;
        margin-left: -5px;
      }
        .reaction {
          position: relative;
          opacity: 0.7;
          display: flex;
          height: 40px;
          padding: 0px 7px;
          justify-content: center;
          align-items: center;
        }
          button.reaction.active {
            background-color: var(--panel);
            border: 1px var(--panel) solid;
            box-shadow: inset 2px 2px 2px #0003;
            opacity: 1;
          }
          button.reaction:hover {
            opacity: 1;
          }
        .reaction img {
          width: 20px;
          fill: var(--dim);
        }
          .reaction .count {
            padding-left: 5px;
            font-size: 22px;
            font-weight: bold;
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
