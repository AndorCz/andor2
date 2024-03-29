<script>
  import { writable } from 'svelte/store'
  import { Render } from '@jill64/svelte-sanitize'
  import { formatDate } from '@lib/utils'
  import { lightboxImage } from '@lib/stores'
  import { getPortrait } from '@lib/database'
  import Reactions from '@components/common/Reactions.svelte'

  export let post
  export let user = null
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

  function triggerModerate () {
    $postStore.moderated = true
    if (onModerate) { onModerate($postStore.id) }
  }

  function onImageClick (event) {
    if (event.target.tagName === 'IMG' && !event.target.classList.contains('icon')) { $lightboxImage = event.target.src }
  }
</script>

<div class='post' class:moderated={$postStore.moderated} class:hidden={$postStore.moderated && !expanded} class:unread={unread} class:whispered={$postStore.audience_names}>
  {#if $postStore.owner_portrait}
    <div class='icon' style='--iconSize: {iconSize}px'>
      {#await getPortrait($postStore.owner, $postStore.owner_portrait) then url}<img src={url} class='portrait' alt={$postStore.owner_name} />{/await}
    </div>
  {/if}
  {#if unread}
    <span class='badge'></span>
  {/if}
  <div class='body'>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class='header'>
      <span class='title' on:click={onHeaderClick}>
        {#if post.owner_type === 'user'}
          <a href={'/user?id=' + post.owner} class='user'>{$postStore.owner_name}</a>
        {:else}
          <a href={'/game/character?id=' + post.owner} class='character'>{$postStore.owner_name}</a>
        {/if}
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
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class='content' on:click={onImageClick}>
      <Render html={$postStore.content} />
      {#if user && allowReactions}
        <Reactions {user} {postStore} />
      {/if}
      <div class='clear'></div>
    </div>
  </div>
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
      min-width: var(--iconSize);
      overflow: hidden;
      position: relative;
    }
      .icon img {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        display: block;
        /* box-shadow: 2px 2px 3px #0002; */
      }

  .body {
    flex: 1;
    overflow: hidden;
  }
    .content {
      background-color: var(--block);
      padding: 20px;
      overflow-wrap: break-word;
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
        .delete, .edit, .moderate {
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
          }
    .clear {
      clear: both;
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
