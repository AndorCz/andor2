<script>
  import { Render } from 'svelte-purify'
  import { tooltip } from '@lib/tooltip'
  import { supabase, handleError } from '@lib/database'

  export let user
  export let post
  export let isMyPost
  export let allowReactions
  export let canDeleteAll
  export let canModerate
  export let iconSize = 140
  export let onDelete
  export let onEdit
  export let onModerate
  export let showDate

  let expanded = false

  const onHeaderClick = (post) => {
    if (post.moderated) { expanded = !expanded }
  }

  function getMyReaction (post, reaction) {
    return post[reaction].findIndex((id) => { return id === user.id })
  }

  function hasReacted (post, reaction) {
    return getMyReaction(post, reaction) > -1
  }

  async function toggleReaction (post, reaction) {
    // update database
    const { data, error } = await supabase.rpc('update_reaction', { post_id: post.id, reaction_type: reaction, action: hasReacted(post, reaction) ? 'remove' : 'add' }).single()
    if (error) { return handleError(error) }

    // update post from the returned database data
    post.frowns = data.frowns
    post.thumbs = data.thumbs
    post.hearts = data.hearts
    post.laughs = data.laughs
  }
</script>

<div class='post' class:moderated={post.moderated} class:hidden={post.moderated && !expanded}>
  {#if post.owner_portrait}
    <div class='icon' style='--iconSize: {iconSize}px'>
      <img src={post.owner_portrait} alt={post.owner_name} />
    </div>
  {/if}
  <div class='body'>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class='header' on:click={() => { onHeaderClick(post) }}>
      <span class='title'>
        <b>{post.owner_name}</b>
        {#if post.audience_names}
          <span class='audience'>jen pro: <b>{post.audience_names.join(', ')}</b></span>
        {/if}
      </span>
      <span class='toolbar'>
        {#if showDate}
          <span class='time'>{new Date(post.created_at).toLocaleString('cs-CZ')}</span>
        {:else}
          <span class='material time' use:tooltip title={new Date(post.created_at).toLocaleString('cs-CZ')}>schedule</span>
        {/if}
        {#if canDeleteAll || isMyPost}
          {#if onEdit}
            <button on:click={() => onEdit(post.id, post.content)} class='material edit' title='Upravit'>edit</button>
          {/if}
          {#if onDelete}
            <button on:click={() => onDelete(post.id)} class='material delete' title='Smazat'>delete</button>
          {/if}
        {:else if canModerate}
          <button on:click={() => onModerate(post.id)} class='material moderate' title='Skrýt všem'>visibility_off</button>
        {/if}
      </span>
      {#if allowReactions}
        {#if user.id}
          <span class='reactions'>
            <button on:click={() => { toggleReaction(post, 'frowns') }} class:active={hasReacted(post, 'frowns')} class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'>{#if post.frowns.length}<span class='count'>{post.frowns.length}</span>{/if}</button>
            <button on:click={() => { toggleReaction(post, 'laughs') }} class:active={hasReacted(post, 'laughs')} class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích'>{#if post.laughs.length}<span class='count'>{post.laughs.length}</span>{/if}</button>
            <button on:click={() => { toggleReaction(post, 'hearts') }} class:active={hasReacted(post, 'hearts')} class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'>{#if post.hearts.length}<span class='count'>{post.hearts.length}</span>{/if}</button>
            <button on:click={() => { toggleReaction(post, 'thumbs') }} class:active={hasReacted(post, 'thumbs')} class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'>{#if post.thumbs.length}<span class='count'>{post.thumbs.length}</span>{/if}</button>
          </span>
        {:else}
          <span class='reactions'>
            {#if post.frowns.length}<span class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'><span class='count'>{post.frowns.length}</span></span>{/if}
            {#if post.laughs.length}<span class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích'><span class='count'>{post.laughs.length}</span></span>{/if}
            {#if post.hearts.length}<span class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'><span class='count'>{post.hearts.length}</span></span>{/if}
            {#if post.thumbs.length}<span class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'><span class='count'>{post.thumbs.length}</span></span>{/if}
          </span>
        {/if}
      {/if}
    </div>
    <div class='content'><Render html={post.content} /></div>
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
      .hidden .content, .hidden .toolbar, .hidden .icon, .hidden .reactions, .hidden .time {
        display: none;
      }
    .header {
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
      .title {
        flex: 1;
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
        .time {
          opacity: 0.5;
        }
        .delete, .edit, .moderate {
          padding: 5px;
          font-size: 19px;
          cursor: pointer;
          opacity: 0.5;
        }
          .delete:hover, .edit:hover, .moderate:hover {
            opacity: 1;
          }

      /* Reactions */
      .reactions {
        display: flex;
        gap: 5px;
        margin-left: 20px;
        margin-right: -5px;
      }
        .reaction {
          position: relative;
          opacity: 0.5;
          display: flex;
          height: 40px;
          padding: 0px 10px;
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
          width: 24px;
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
  }
</style>
