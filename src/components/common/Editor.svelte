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
  let selectedStyle = 'paragraph'

  onMount(() => {
    editor = new Editor({
      element: editorEl,
      content,
      extensions: [
        StarterKit,
        Underline,
        BubbleMenu.configure({ element: bubbleEl, tippyOptions: { offset: [0, 20] } })
      ],
      onTransaction: () => { editor = editor } // force re-render so `editor.isActive` works as expected
    })
  })

  onDestroy(() => { if (editor) { editor.destroy() } })

  export function getEditor () { return editor }

  function applyStyle (style) {
    switch (style) {
      case 'heading1': editor.chain().focus().setHeading({ level: 1 }).run(); break
      case 'heading2': editor.chain().focus().setHeading({ level: 2 }).run(); break
      case 'heading3': editor.chain().focus().setHeading({ level: 3 }).run(); break
      default: editor.chain().focus().setParagraph().run()
    }
    selectedStyle = style
  }
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
    {#if editor}
      <button on:click={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} class={editor.isActive('bold') ? 'material active' : 'material'}>format_bold</button>
      <button on:click={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} class={editor.isActive('italic') ? 'material active' : 'material'}>format_italic</button>
      <button on:click={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} class={editor.isActive('underline') ? 'material active' : 'material'}>format_underlined</button>
      <!--<button on:click={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} class={editor.isActive('strike') ? 'active material' : 'material'} >format_strikethrough</button>-->
      <select bind:value={selectedStyle} on:change={() => applyStyle(selectedStyle)}>
        <option value='paragraph'>Normální</option>
        <option value='heading1'>Nadpis 1</option>
        <option value='heading2'>Nadpis 2</option>
        <option value='heading3'>Nadpis 3</option>
      </select>
    {/if}
  </div>
  <div class='editor' bind:this={editorEl}></div>
</div>

<style>
  .bubble {
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 12px;
    display: flex;
    gap: 10px;
  }
    .bubble::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 50%;
      width: 12px;
      height: 12px;
      transform: translate(-50%, -50%) rotate(45deg);
      background-color: color-mix(in srgb, var(--panel), #FFF 5%);
      box-shadow: 2px 2px 2px #0003;
    }
    .bubble button {
      padding: 5px;
    }
    .bubble button.active {
      background-color: var(--panel);
      border: 1px var(--panel) solid;
      box-shadow: inset 2px 2px 2px #0003;
    }
  select {
    width: 150px;
    padding: 0px 5px 5px 10px;
    background-color: var(--buttonBg);
  }
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
