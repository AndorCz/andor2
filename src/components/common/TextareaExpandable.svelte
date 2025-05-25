<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import Editor from '@components/common/Editor.svelte'
  import Loading from '@components/common/Loading.svelte'

  export let user
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
  export let disableEmpty = true
  export let maxlength = null
  export let loading = false
  export let singleLine = false
  export let placeholder = ''
  export let fonts = null
  export let mentionList = null
  export let forceBubble = false
  export let autoFocus = false

  let tiptap
  let isEmpty = true
  let editorRef
  let textareaRef
  let originalValue = value
  let height = '60px'

  onMount(() => {
    if (allowHtml) {
      tiptap = editorRef.getEditor()
      if (value) { editorRef.setContent(value) } // set html content
      isEmpty = allowHtml ? tiptap.isEmpty : value.length === 0
    } else {
      isEmpty = value.length === 0
    }
  })

  function setHeight (node) { // textarea only
    textareaRef.style.height = 'auto'
    height = singleLine ? '60px' : `${textareaRef.scrollHeight > minHeight ? textareaRef.scrollHeight : minHeight}px`
    textareaRef.style.height = height
  }

  export function getIsEmpty () { return isEmpty }

  export async function getContent () { // 2DO: Remove
    return value
  }

  export async function triggerEdit (id, content) {
    if (allowHtml) { editorRef.getEditor().commands.focus() } else { document.getElementById(id)?.focus() }
    editing = id
    if (allowHtml) {
      editorRef.getEditor().commands.setContent(content)
      originalValue = tiptap.getHTML()
      onChange()
    } else {
      value = content
      originalValue = content
    }
    editing = false
  }

  async function cancelEdit () {
    const val = allowHtml ? tiptap.getHTML() : editorRef.value
    console.log('cancelEdit, val: ' + val + ', originalValue: ' + originalValue)
    const shouldCancel = (val === originalValue) ? true : window.confirm('Opravdu zrušit úpravu?')
    if (shouldCancel) {
      value = ''
      if (allowHtml) { editorRef.getEditor().commands.clearContent(true) }
      editing = false
    }
  }

  async function triggerSave (html) {
    if (allowHtml) {
      value = await tiptap.getHTML() // get latest html from editor
      await onSave()
      tiptap.commands.clearContent(true)
    } else {
      onSave() // otherwise the binded textarea value is used
    }
  }

  // handle editor typing
  function onKeyUp (e) { if (onTyping) { onTyping(e) } }

  function onChange () {
    isEmpty = allowHtml ? tiptap.isEmpty : value.length === 0
  }

  export function addReply (postId, userName, userId) {
    return editorRef.addReply(postId, userName, userId)
  }

  // handle enter and escape
  async function handleKeyDown (event) {
    if (event.key === 'Escape' && editing) { await cancelEdit() }
    if (!allowHtml) { // TipTap has it's own input event handling
      if (enterSend && event.keyCode === 13 && !event.shiftKey) { // send with enter, new line with shift+enter
        event.preventDefault()
        triggerSave()
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class='wrapper' class:singleLine class:bubbleMenu={allowHtml && forceBubble}>
  {#if allowHtml}
    <Editor bind:value={value} bind:this={editorRef} {singleLine} {forceBubble} {onKeyUp} {onChange} {minHeight} {triggerSave} {enterSend} {user} {fonts} {mentionList} />
  {:else}
    {#if maxlength}
      <span class='counter'>{maxlength - value.length}</span>
    {/if}
    <!-- svelte-ignore a11y-autofocus -->
    <textarea bind:this={textareaRef} autofocus={autoFocus} bind:value={value} {placeholder} {name} {id} use:setHeight on:input={setHeight} on:keyup={onKeyUp} on:input={onChange} class:withButton={showButton} {maxlength} style='--minHeight:{minHeight}px'></textarea>
  {/if}
  <div class='buttons'>
    <button on:click={cancelEdit} class='cancel' class:hidden={!editing} title='Zrušit'>
      <span class='material'>close</span>
    </button>
    <button on:click={triggerSave} class='save' class:hidden={!showButton} title={editing ? 'Uložit' : buttonTitle} disabled={disabled || (disableEmpty && isEmpty)} use:tooltip>
      <span class='material'>{#if editing}check{:else}{buttonIcon}{/if}</span>
    </button>
  </div>
  {#if loading}
    <Loading />
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    width: 100%;
    min-width: 0px;
  }
    textarea {
      width: 100%;
      height: 100%;
      min-height: var(--minHeight);
      display: block;
    }
      .singleLine textarea {
        min-height: 30px !important;
        overflow-y: auto;
        padding: 0px;
        padding-left: 15px;
        padding-top: 15px;
      }
    .withButton {
      padding-right: 80px;
    }

    .buttons {
      position: absolute;
      top: 0px;
      right: 0px;
      padding-top: 50px; /* to account for wysiwyg menu */
      height: 100%;
      display: flex;
      flex-direction: column;
      width: fit-content;
      justify-content: space-between;
      align-items: center;
    }
      .bubbleMenu .buttons {
        padding-top: 0px;
      }
      .singleLine {
        flex-direction: row;
      }
      .singleLine .buttons {
        top: 0px; /* for single line */
        flex-direction: row-reverse;
      }
      button {
        padding: 10px 15px;
      }
      .save {
        border-radius: 10px 0px 10px 0px;
        border-bottom: 3px var(--buttonBg) solid;
      }
      .cancel {
        visibility: visible;
        border-radius: 0px 10px 0px 10px;
      }
        .cancel.hidden {
          visibility: hidden;
        }
      .singleLine button {
        background: none;
        border: none;
        border-radius: 10px;
        box-shadow: none;
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
  @media (max-width: 720px) {
    .buttons {
      padding-top: 0px !important;
      padding-bottom: 50px !important;
    }
  }
  @media (max-width: 500px) {
    button {
      padding: 10px 15px;
    }
    .withButton {
      padding-right: 40px;
    }
  }
</style>
