<script>
  import { onMount, onDestroy } from 'svelte'
  import { Editor } from '@tiptap/core'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import StarterKit from '@tiptap/starter-kit'
  import Underline from '@tiptap/extension-underline'

  export let content = ''

  let editor
  let editorEl
  let bubbleEl

  onMount(() => {
    editor = new Editor({
      element: editorEl,
      content,
      extensions: [
        StarterKit,
        Underline,
        BubbleMenu.configure({ element: bubbleEl })
      ],
      onTransaction: () => { editor = editor } // force re-render so `editor.isActive` works as expected
    })
  })

  onDestroy(() => { if (editor) { editor.destroy() } })
</script>

<!--
{#if editor}
  <div class='tools'>
    <button on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} class:active={editor.isActive('heading', { level: 1 })} >H1</button>
    <button on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} class:active={editor.isActive('heading', { level: 2 })} >H2</button>
    <button on:click={() => editor.chain().focus().setParagraph().run()} class:active={editor.isActive('paragraph')}>P</button>
  </div>
{/if}
-->

<div class='wrapper'>
  <div class='bubble' bind:this={bubbleEl}>
    <button on:click={() => editor.chain().focus().toggleBold().run()} class='material'>format_bold</button>
    <button on:click={() => editor.chain().focus().toggleItalic().run()} class='material'>format_italic</button>
    <button on:click={() => editor.chain().focus().toggleUnderline().run()} class='material'>format_underlined</button>
  </div>
  <div class='editor' bind:this={editorEl}></div>
</div>

<style>
  /*
  .tools {
    margin-bottom: 20px;
  }
  button.active {
    background: black;
    color: white;
  }
  */
</style>
