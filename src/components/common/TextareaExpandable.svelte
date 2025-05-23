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
  export let preserveValue = false

  let isEmpty = true
  let editorRef
  let tiptap
  let originalValue = value
  let height = '60px'

  onMount(() => {
    if (allowHtml) {
      tiptap = editorRef.getEditor()
      if (value) { editorRef.setContent(value) } // set html content
      isEmpty = allowHtml ? tiptap.isEmpty : value.length === 0
    }
  })

  function setHeight (node) { // textarea only
    const textareaRef = node.target || node
    textareaRef.style.height = 'auto'
    height = singleLine ? '60px' : `${textareaRef.scrollHeight > minHeight ? textareaRef.scrollHeight : minHeight}px`
    textareaRef.style.height = height
  }

  async function cancelEdit () {
    if (value !== originalValue) {
      if (window.confirm('Opravdu zrušit úpravu?')) {
        if (preserveValue) {
          value = originalValue
        } else {
          value = ''
          if (allowHtml) { editorRef.getEditor().commands.clearContent(true) }
        }
        editing = false
      }
    }
  }

  export function getIsEmpty () { return isEmpty }

  export async function getContent () { // 2DO: Remove
    return value
  }

  export async function triggerEdit (id, content) {
    editing = id
    if (allowHtml) {
      editorRef.getEditor().commands.setContent(content)
      originalValue = value
      onChange()
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
    <textarea autofocus={autoFocus} bind:value={value} {placeholder} {name} {id} use:setHeight on:input={setHeight} on:keyup={onKeyUp} on:input={onChange} class:withButton={showButton} {maxlength} style='--minHeight:{minHeight}px'></textarea>
  {/if}
  {#if showButton}
    <button on:click={triggerSave} disabled={disabled || (disableEmpty && isEmpty)} class='save' title={editing ? 'Uložit' : buttonTitle} use:tooltip>
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
        top: 50px;
        border-radius: 0px 10px 0px 10px;
      }
      .singleLine .save, .singleLine .cancel {
        right: 5px;
        bottom: 50px;
        background: none;
        border: none;
        border-radius: 10px;
        box-shadow: none;
      }
        .singleLine .cancel {
          top: unset;
          right: 50px;
        }
      .bubbleMenu .save {
        bottom: 5px;
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
    .cancel {
      top: 0px;
    }
    .save {
      bottom: 50px;
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
