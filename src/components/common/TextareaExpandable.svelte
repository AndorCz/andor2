<script>
  import { onMount } from 'svelte'
  import Editor from '@components/common/Editor.svelte'
  import Loading from '@components/common/Loading.svelte'

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
  export let maxlength = null
  export let loading = false
  export let singleLine = false

  let isEmpty = value === ''
  let editorRef
  let tiptap
  let originalValue = value

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
    if (singleLine) {
      textareaRef.style.height = '60px'
      console.log(textareaRef.scrollHeight)
    } else {
      textareaRef.style.height = `${textareaRef.scrollHeight > minHeight ? textareaRef.scrollHeight : minHeight}px`
    }
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

  export function getIsEmpty () { return isEmpty }

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

<div class='wrapper' class:singleLine>
  {#if allowHtml}
    <Editor bind:this={editorRef} {onKeyUp} {onChange} {minHeight} {triggerSave} {enterSend} {userId} />
  {:else}
    {#if maxlength}
      <span class='counter'>{maxlength - value.length}</span>
    {/if}
    <textarea bind:value={value} {name} {id} use:setHeight on:input={setHeight} on:keyup={onKeyUp} on:input={onChange} class:withButton={showButton} {maxlength}></textarea>
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
  {#if loading}
    <Loading />
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
    .singleLine textarea {
      min-height: 30px !important;
      overflow: hidden;
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
      .singleLine .save, .singleLine .cancel {
        right: 5px;
        bottom: 5px;
        background: none;
        border: none;
        border-radius: 10px;
        box-shadow: none;
      }
        .singleLine .cancel {
          top: unset;
          right: 50px;
        }
    .counter {
      position: absolute;
      right: 15px;
      bottom: 15px;
      text-align: right;
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
