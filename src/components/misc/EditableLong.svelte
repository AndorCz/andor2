<script>
  import { marked } from 'marked'

  export let value
  export let onSave
  export let loading = false
  export let canEdit = false

  let isEditing = false

  let textareaHeight

  function setHeight (node) {
    let textareaRef = node.target || node
    textareaRef.style.height = 'auto'
    textareaRef.style.height = `${textareaRef.scrollHeight}px`
  }
</script>

<div class='wrapper'>
  {#if loading}
    <div id='dots'></div>
  {/if}
  {#if isEditing}
    <textarea bind:value={value} use:setHeight on:input={setHeight}></textarea>
    <button on:click={() => { onSave(); isEditing = false }}><span class='material-symbols-rounded'>done</span></button>
  {:else}
    <content class='editableLong'>{@html marked(value)}</content>
    {#if canEdit}
      <button on:click={() => { isEditing = true }}><span class='material-symbols-rounded'>edit</span></button>
    {/if}
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
  }
    content, textarea {
      width: 100%;
      height: auto;
      min-height: 100px;
      display: block;
      padding-right: 80px;
    }
    content {
      padding: 0px 20px;
      padding-right: 80px;
      font-size: 15pt;
      line-height: 1.5;
      background-color: var(--block);
    }

    button {
      position: absolute;
      bottom: 0px;
      right: 0px;
      border-radius: 0px;
      padding: 15px 20px;
    }

    #dots {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90px;
      height: 14px;
      background:
        radial-gradient(circle closest-side, var(--accent) 92%,#0000 ) calc(100%/-4) 0,
        radial-gradient(circle closest-side, var(--accent) 92%,#0000 ) calc(100%/4)  0;
      background-size: calc(100%/2) 100%;
      animation: rotation 1.5s infinite;
    }
    @keyframes rotation {
      0%   {background-position: calc(100%/-4) 0    ,calc(100%/4) 0}
      50%  {background-position: calc(100%/-4) -14px,calc(100%/4) 14px}
      100% {background-position: calc(100%/4)  -14px,calc(3*100%/4) 14px}
    }
</style>