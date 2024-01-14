<script>
  // import { onMount } from 'svelte'
  import Editor from '@components/common/Editor.svelte'

  export let value
  export let onSave
  export let allowHtml = false
  export let name = 'textarea'
  export let disabled = false
  export let showButton = false
  export let buttonIcon = 'send'
  export let editing = false
  export let minHeight = 140
  export let enterSend = false

  let editorRef

  function setHeight (node) {
    const textareaRef = node.target || node
    textareaRef.style.height = 'auto'
    textareaRef.style.height = `${textareaRef.scrollHeight > minHeight ? textareaRef.scrollHeight : minHeight}px`
  }

  function cancelEdit () {
    if (window.confirm('Opravdu zrušit úpravu?')) {
      editing = false
      value = ''
      if (allowHtml) { editorRef.getEditor().commands.clearContent(true) }
    }
  }

  export function triggerEdit (id, content) {
    editing = id
    if (allowHtml) { editorRef.getEditor().commands.setContent(content) }
  }

  async function triggerSave (html) {
    if (allowHtml) {
      const tiptap = editorRef.getEditor()
      value = await tiptap.getHTML() // get html from editor
      await onSave()
      tiptap.commands.clearContent(true)
    } else {
      onSave() // otherwise the binded textarea value is used
    }
  }

  function onKeyDown (e) {
    if (enterSend && event.keyCode === 13 && !e.shiftKey) { // send with enter, new line with shift+enter
      e.preventDefault()
      onSave()
    }
  }
</script>

<div class='wrapper'>
  {#if allowHtml}
    <Editor bind:this={editorRef} />
  {:else}
    <textarea bind:value={value} {name} use:setHeight on:input={setHeight} on:keydown={onKeyDown} class={showButton && 'withButton'}></textarea>
  {/if}
  {#if showButton}
    <button on:click={triggerSave} {disabled} class='save' title={editing ? 'Upravit' : 'Odeslat'}>
      <span class='material'>{#if editing}edit{:else}{buttonIcon}{/if}</span>
    </button>
  {/if}
  {#if editing}
    <button on:click={cancelEdit} class='cancel'>
      <span class='material'>close</span>
    </button>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    width: 100%;
  }
    textarea {
      width: 100%;
      min-height: 100%;
      display: block;
    }
      .withButton {
        padding-right: 80px;
      }

    button {
      position: absolute;
      right: 0px;
      padding: 15px 20px;
    }
      .save {
        bottom: 0px;
        border-radius: 10px 0px 10px 0px;
      }
      .cancel {
        top: 0px;
        border-radius: 0px 10px 0px 10px;
      }
  @media (max-width: 719px) {
    button {
      padding: 10px 15px;
    }
  }
</style>
