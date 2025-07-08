<script>
  import DOMPurify from 'dompurify'
  import { tooltip } from '@lib/tooltip'
  import { formatDate } from '@lib/utils'
  import { lightboxImage } from '@lib/stores'

  const { post, canDelete = false, onDelete = null } = $props()

  function onImageClick (event) {
    if (event.target.tagName === 'IMG' && !event.target.classList.contains('icon')) { $lightboxImage = event.target.src }
  }
</script>

<div class='imagePost'>
  <div class='body'>
    <div class='header'>
      <span class='time'>{formatDate(post.created_at)}</span>
      {#if onDelete && canDelete}
        <button onclick={() => onDelete(post)} class='material delete' title='Smazat' use:tooltip>delete</button>
      {/if}
    </div>
    <div class='content' onclick={onImageClick}>
      {@html DOMPurify.sanitize(post.content, { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })}
      <div class='clear'></div>
    </div>
  </div>
</div>

<style>
  .imagePost {
    position: relative;
    display: flex;
    width: 100%;
    margin-top: 10px;
    padding-bottom: 10px;
    text-align: left;
    gap: 10px;
  }
  .body {
    flex: 1;
    overflow: hidden;
  }
    .content {
      background-color: var(--block);
      overflow-wrap: anywhere;
    }
    .header {
      position: relative;
      width: 100%;
      min-height: 50px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      border-bottom: 1px var(--panel) solid;
      background-color: var(--block);
      padding: 5px 15px;
      color: var(--dim);
    }
      .header button {
        background: none;
        border: none;
        box-shadow: none;
        color: var(--dim);
      }
      .time {
        font-family: arial, sans-serif;
        font-size: 14px;
        opacity: 0.7;
        margin-right: 5px;
      }
      .delete {
        padding: 5px;
        font-size: 19px;
        cursor: pointer;
        opacity: 0.7;
      }
        .time:hover, .delete:hover {
          opacity: 1;
          color: var(--text);
        }
    .clear {
      clear: both;
    }

  @media (max-width: 860px) {
    .imagePost {
      gap: 0px;
    }
    .toolbar {
      gap: 5px;
    }
    .header {
      display: block;
      padding: 10px 10px 5px 10px;
      padding-left: 15px;
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
