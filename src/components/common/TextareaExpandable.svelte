<script>
  import { onMount } from 'svelte'
  import Editor from '@components/common/Editor.svelte'

  export let userId
  export let id = null
  export let value = ''
  export let onSave = null
  export let onTyping = null
  export let allowHtml = false
  export let name = 'textarea'
  export let disabled = false
  export let showButton = false
  export let buttonIcon = 'send'
  export let buttonTitle = 'Odeslat'
  export let editing = false
  export let minHeight = 140
  export let enterSend = false
  export let disableEmpty = false

  let editorRef
  let tiptap
  let originalValue = value
  let isEmpty = true

  onMount(() => {
    if (allowHtml) {
      tiptap = editorRef.getEditor()
      if (value) {
        // set html content
        tiptap.commands.setContent(value)
      }
    }
  })

  function setHeight (node) { // textarea only
    const textareaRef = node.target || node
    textareaRef.style.height = 'auto'
    textareaRef.style.height = `${textareaRef.scrollHeight > minHeight ? textareaRef.scrollHeight : minHeight}px`
  }

  async function cancelEdit () {
    const currentValue = allowHtml ? await tiptap.getHTML() : value
    if (currentValue !== originalValue) {
      if (!window.confirm('Opravdu zrušit úpravu?')) { return }
    }
    editing = false
    value = originalValue
    if (allowHtml) { editorRef.getEditor().commands.clearContent(true) }
  }

  export async function getContent () {
    return allowHtml ? await tiptap.getHTML() : value
  }

  export async function triggerEdit (id, content) {
    editing = id
    if (allowHtml) {
      editorRef.getEditor().commands.setContent(content)
      originalValue = await tiptap.getHTML()
    }
  }

  async function triggerSave (html) {
    if (allowHtml) {
      value = await tiptap.getHTML() // get html from editor
      if (value) {
        await onSave()
        tiptap.commands.clearContent(true)
      }
    } else {
      onSave() // otherwise the binded textarea value is used
    }
  }

  // handle editor typing
  function onKeyUp (e) { if (onTyping) { onTyping(e) } }

  function onChange () {
    isEmpty = allowHtml ? tiptap.isEmpty : value.length === 0
  }

  export function addReply (postId, userName) {
    return editorRef.addReply(postId, userName)
  }

  // handle enter and escape
  async function handleKeyDown (event) {
    if (event.key === 'Escape' && editing) { cancelEdit() }
    if (!allowHtml) { // TipTap has it's own input event handling
      if (enterSend && event.keyCode === 13 && !event.shiftKey) { // send with enter, new line with shift+enter
        event.preventDefault()
        triggerSave()
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class='wrapper'>
  {#if allowHtml}
    <Editor bind:this={editorRef} {onKeyUp} {onChange} {minHeight} {triggerSave} {enterSend} {userId} />
  {:else}
    <textarea bind:value={value} {name} {id} use:setHeight on:input={setHeight} on:keyup={onKeyUp} on:input={onChange} class:withButton={showButton}></textarea>
  {/if}
  {#if showButton}
    <button on:click={triggerSave} disabled={disabled || (disableEmpty && isEmpty)} class='save' title={editing ? 'Uložit' : buttonTitle}>
      <span class='material'>{#if editing}check{:else}{buttonIcon}{/if}</span>
    </button>
  {/if}
  {#if editing}
    <button on:click={cancelEdit} class='cancel' title='Zrušit'>
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
      height: 100%;
      min-height: 110px;
      display: block;
    }
    .withButton {
      padding-right: 80px;
    }

    button {
      position: absolute;
      right: 0px;
      padding: 10px 15px;
    }
      .save {
        bottom: 0px;
        border-radius: 10px 0px 10px 0px;
        border-bottom: 3px var(--buttonBg) solid;
      }
      .cancel {
        top: 0px;
        border-radius: 0px 10px 0px 10px;
      }
  @media (max-width: 860px) {
    button {
      padding: 10px 15px;
    }
  }
  @media (max-width: 500px) {
    button {
      padding: 10px 15px;
    }
    .withButton {
      padding-right: 0px;
    }
  }
</style>
