<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { formatDate } from '@lib/utils'
  import { tooltipContent } from '@lib/tooltip'
  import { getPortraitUrl } from '@lib/database-browser'
  import { Render } from '@jill64/svelte-sanitize'
  import Reactions from '@components/common/Reactions.svelte'
  import ReactionInput from '@components/common/ReactionInput.svelte'
  import ReactionDisplay from '@components/common/ReactionDisplay.svelte'

  export let user
  export let post
  export let onEdit
  export let onDelete
  export let unread = false
  export let onReply

  let toolbarEl
  let contentEl
  const isMine = post.owner === user.id
  const postStore = writable(post)

  onMount(() => {
    checkMeMentioned()
  })

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

<div class='postRow {isMine ? 'mine' : 'theirs'}' class:unread={unread}>
  {#if isMine}
    <div class='rowInner'>
      <div class='toolbar' bind:this={toolbarEl}>
        <span class='time'>{formatDate(post.created_at)}</span>
        <div class='buttons'>
          <button on:click={() => onEdit(post.id, post.content)} class='material edit' title='Upravit'>edit</button>
          <button on:click={() => onDelete(post.id)} class='material delete' title='Smazat'>delete</button>
        </div>
      </div>
      <div class='post' use:tooltipContent={{ content: toolbarEl, trigger: 'click' }}>
        <div class='content' bind:this={contentEl}>
          <Render html={$postStore.content} options={{ dompurify: { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] } }} />
          {#if $postStore.created_at !== $postStore.updated_at}<span class='edited'>(upraveno)</span>{/if}
        </div>
      </div>
      {#if post.owner_portrait}
        <a href={'/user?id=' + post.owner} class='user'>
          <img src={getPortraitUrl(post.owner, post.owner_portrait)} class='portrait' alt={post.owner_name} />
        </a>
      {/if}
    </div>
    <Reactions {user} itemStore={postStore} type='post' />
  {:else}
    <div class='rowInner'>
      {#if post.owner_portrait}
        <a href={'/user?id=' + post.owner} class='user'>
          <img src={getPortraitUrl(post.owner, post.owner_portrait)} class='portrait' alt={post.owner_name} />
        </a>
      {/if}
      <div class='toolbar' bind:this={toolbarEl}>
        <span class='time'>{formatDate(post.created_at)}</span>
        <div class='rowInner'>
          <ReactionInput {user} itemStore={postStore} type='post' />
          <button on:click={() => { onReply(post.id, post.owner_name, post.owner) }} class='material reply square'>reply</button>
        </div>
      </div>
      <div class='post' title={formatDate(post.created_at)} use:tooltipContent={{ content: toolbarEl, trigger: 'click' }}>
        {#if unread}
          <span class='badge'></span>
        {/if}
        <div class='name'>{post.owner_name}</div>
        <div class='content' bind:this={contentEl}>
          <Render html={post.content} />
          {#if $postStore.created_at !== $postStore.updated_at}<span class='edited'>(upraveno)</span>{/if}
        </div>
      </div>
    </div>
    <ReactionDisplay {user} itemStore={postStore} type='post' />
  {/if}
</div>

<style>
  .postRow {
    display: flex;
    gap: 10px;
    margin: 10px 0px;
  }
    .rowInner {
      position: relative;
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }
      .theirs {
        flex-direction: row;
      }
      .theirs .rowInner {
        justify-content: flex-start;
      }
      .mine {
        flex-direction: row-reverse;
      }
      .mine .rowInner {
        justify-content: flex-end;
      }
      .post {
        position: relative;
        padding: 10px 20px;
        cursor: pointer;
      }
        .name {
          font-weight: bold;
        }
        .content {
          text-align: left;
          overflow-wrap: anywhere;
        }
        .portrait {
          display: block;
          min-width: 60px;
          width: 60px;
          height: 70px;
          object-fit: cover;
          object-position: center 20%;
          border-radius: 10px;
          box-shadow: 2px 2px 3px #0003;
        }
          .theirs .post {
            border-radius: 20px 20px 20px 0px;
            background-color: var(--block);
            text-align: left;
          }
            .theirs .post:hover {
              background-color: color-mix(in srgb, var(--block) 95%, #fff 5%);
            }
          .mine .post {
            border-radius: 20px 20px 0px 20px;
            background-color: var(--prominent);
            color: var(--gray90);
            text-align: right;
          }
            .mine .post:hover {
              background-color: color-mix(in srgb, var(--prominent) 95%, #fff 5%);
            }
    .toolbar {
      padding: 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }
      .time {
        white-space: nowrap;
      }
      .mine .toolbar {
        right: 0px;
      }
      .theirs .toolbar {
        left: 0px;
      }
      .edit, .delete, .reply {
        padding: 5px;
      }
    .badge {
      left: 0px;
    }
    .edited {
      font-size: 12px;
      color: var(--dim);
    }
  @media (max-width: 500px) {
    .portrait {
      min-width: 50px;
      width: 50px;
      height: 50px;
    }
    .postRow {
      flex-direction: column;
      gap: 0px;
    }
      .mine .toolbar {
        right: 0px;
      }
      .theirs .toolbar {
        left: 0px;
      }
      .edit, .delete {
        padding: 5px;
      }
  }
</style>
