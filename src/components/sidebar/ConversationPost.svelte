<script>
  import { Render } from '@jill64/svelte-sanitize'
  import { formatDate } from '@lib/utils'
  import { tooltipContent } from '@lib/tooltip'

  export let us
  export let message
  export let onEdit
  export let onDelete
  export let senderColumn
  export let isMessageUnread
  export let onImageClickInPost

  let toolbarEl

  $: isMine = message[senderColumn] === us.id
</script>

<div class={`${isMine ? 'mine' : 'theirs'} postRow`}>
  <div class='rowInner'>
    <div class='toolbarTooltipContent' bind:this={toolbarEl}>
      <span class='time'>{formatDate(message.created_at)}</span>
      {#if isMine}
        <div class='buttons'>
          <button class='square material edit' on:click={() => onEdit(message)} title='Upravit'>edit</button>
          <button class='square material delete' on:click={() => onDelete(message.id)} title='Smazat'>delete</button>
        </div>
      {/if}
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class='bubble' on:click={onImageClickInPost} use:tooltipContent={{ content: toolbarEl, trigger: 'click', placement: isMine ? 'left' : 'right', interactive: true, arrow: true }} >
      <div class='content'>
        <Render html={message.content} options={{ dompurify: { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] } }} />
      </div>
      {#if isMessageUnread(message) && !isMine}
        <span class='badge'></span>
      {/if}
      {#if message.created_at !== message.updated_at}
        <span class='edited'>upraveno</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .postRow {
    display: flex;
    gap: 10px;
    margin: 2px 0px;
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
      .theirs .bubble {
        background-color: var(--block);
        border-radius: 15px 15px 15px 5px;
      }
      .mine .bubble {
        border-radius: 20px 20px 0px 20px;
        background-color: var(--prominent);
        color: var(--gray90);
        text-align: right;
        float: right;
        cursor: pointer;
      }
        .mine .bubble:hover {
          background-color: color-mix(in srgb, var(--prominent) 95%, #fff 5%);
        }

  .bubble {
    padding: 8px 12px;
    border-radius: 15px;
    position: relative;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .content {
    font-size: 0.95em;
    line-height: 1.4;
  }
  .content :global(img) {
    max-width: 100%;
    border-radius: 5px;
    margin-top: 5px;
  }
  .content :global(p:first-child) {
    margin-top: 0;
  }
  .content :global(p:last-child) {
    margin-bottom: 0;
  }
  .edited {
    font-size: 12px;
    color: var(--dim);
  }
  .badge {
    left: 0px;
  }

  /* Toolbar */

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
    .edit, .delete {
      padding: 5px;
    }
  .toolbarTooltipContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 10px;
  }
  .buttons {
    display: flex;
    gap: 5px;
  }
</style>
