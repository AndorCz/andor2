<script>
  import { writable } from 'svelte/store'
  import { formatDate } from '@lib/utils'
  import { tooltipContent } from '@lib/tooltip'
  import { Render } from '@jill64/svelte-sanitize'
  import Reactions from '@components/common/Reactions.svelte'
  import ReactionInput from '@components/common/ReactionInput.svelte'
  import ReactionDisplay from '@components/common/ReactionDisplay.svelte'

  export let user
  export let post
  export let onEdit
  export let onDelete

  let toolbarRef
  const isMine = post.owner === user.id
  const postStore = writable(post)
</script>

<div class='postRow {isMine ? 'mine' : 'theirs'}'>
  {#if isMine}
    <Reactions {user} {postStore} />
    <div class='toolbar' bind:this={toolbarRef}>
      {formatDate(post.created_at)}
      <button on:click={() => onEdit(post.id, post.content)} class='material edit' title='Upravit'>edit</button>
      <button on:click={() => onDelete(post.id)} class='material delete' title='Smazat'>delete</button>
    </div>
    <div class='post' use:tooltipContent={{ content: toolbarRef, trigger: 'click' }}>
      <div class='content'><Render html={post.content} /></div>
    </div>
    {#if post.owner_portrait}
      <img class='portrait' src={post.owner_portrait} alt={post.owner_name} />
    {/if}
  {:else}
    {#if post.owner_portrait}
      <img class='portrait' src={post.owner_portrait} alt={post.owner_name}/>
    {/if}
    <div class='toolbar' bind:this={toolbarRef}>
      {formatDate(post.created_at)}
      <ReactionInput {user} {postStore} />
    </div>
    <div class='post' title={formatDate(post.created_at)} use:tooltipContent={{ content: toolbarRef, trigger: 'click' }}>
      <div class='name'>{post.owner_name}</div>
      <div class='content'><Render html={post.content} /></div>
    </div>
    <ReactionDisplay {postStore} />
  {/if}
</div>

<style>
  .postRow {
    position: relative;
    display: flex;
    gap: 10px;
    align-items: flex-end;
    margin: 10px 0px;
  }
    .theirs {
      justify-content: flex-start;
    }
    .mine {
      justify-content: flex-end;
    }
      .post {
        position: relative;
        max-width: 88%;
        padding: 10px 20px;
        cursor: pointer;
      }
        .name {
          font-weight: bold;
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
      display: flex;
      gap: 10px;
      align-items: center;
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
</style>
