<script>
  import { onMount, onDestroy } from 'svelte'
  import { Editor } from '@tiptap/core'
  import { Color } from '@tiptap/extension-color'
  import Link from '@tiptap/extension-link'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import StarterKit from '@tiptap/starter-kit'
  import Underline from '@tiptap/extension-underline'
  import TextAlign from '@tiptap/extension-text-align'
  import Dropdown from '@components/common/Dropdown.svelte'
  import TextStyle from '@tiptap/extension-text-style'

  export let content = ''

  let editor
  let editorEl
  let bubbleEl
  let currentStyle
  let currentAlign

  const styleOptions = [
    { value: 'paragraph', icon: 'format_paragraph' },
    { value: 'heading1', icon: 'format_h1' },
    { value: 'heading2', icon: 'format_h2' },
    { value: 'heading3', icon: 'format_h3' }
  ]

  const alignOptions = [
    { value: 'left', icon: 'format_align_left' },
    { value: 'center', icon: 'format_align_center' },
    { value: 'right', icon: 'format_align_right' },
    { value: 'justify', icon: 'format_align_justify' }
  ]

  onMount(() => {
    editor = new Editor({
      element: editorEl,
      content,
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Link.configure({ openOnClick: false }),
        Color.configure({ types: ['textStyle'] }),
        BubbleMenu.configure({ element: bubbleEl, tippyOptions: { offset: [0, 20], maxWidth: 'none' } }),
        TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] })
      ],
      onTransaction: () => { editor = editor }, // force re-render so `editor.isActive` works as expected
      onSelectionUpdate: ({ editor }) => {
        // check for headings and paragraph
        const headingLevel = editor.getAttributes('heading').level
        currentStyle = headingLevel ? `heading${headingLevel}` : 'paragraph'
        // check for text alignment based on https://github.com/ueberdosis/tiptap/issues/4240#issuecomment-1673411677
        currentAlign = ['left', 'center', 'right', 'justify'].find((alignment) => editor.isActive({ textAlign: alignment }))
      }
    })
  })

  onDestroy(() => { if (editor) { editor.destroy() } })

  export function getEditor () { return editor }

  function handleStyleSelect (selectedOption) {
    switch (selectedOption.detail.value) {
      case 'heading1': editor.chain().focus().setHeading({ level: 1 }).run(); break
      case 'heading2': editor.chain().focus().setHeading({ level: 2 }).run(); break
      case 'heading3': editor.chain().focus().setHeading({ level: 3 }).run(); break
      default: editor.chain().focus().setParagraph().run()
    }
    // selectedStyle = selectedOption.detail.value
  }

  function handleAlignSelect (selectedOption) {
    editor.chain().focus().setTextAlign(selectedOption.detail.value).run()
    // selectedAlign = selectedOption.value
  }

  function setLink () {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url) {
      if (url === '') { return editor.chain().focus().extendMarkRange('link').unsetLink().run() } // empty
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run() // update
    }
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
      <span class='sep'></span>
      <input class='button' type='color' on:input={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color} />
      <button on:click={() => editor.chain().focus().unsetColor().run()} class={editor.isActive('textStyle') ? 'material' : 'material active'}>format_color_reset</button>
      <span class='sep'></span>
      <button on:click={setLink} class='material'>link</button>
      <button on:click={() => editor.chain().focus().unsetLink().run()} class={editor.isActive('link') ? 'material' : 'material active'}>link_off</button>
      <span class='sep'></span>
      <!--<button on:click={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} class={editor.isActive('strike') ? 'active material' : 'material'} >format_strikethrough</button>-->
      <Dropdown iconsOnly current={currentStyle} defaultLabel='format_paragraph' options={styleOptions} on:select={handleStyleSelect} />
      <Dropdown iconsOnly current={currentAlign} defaultLabel='format_align_left' options={alignOptions} on:select={handleAlignSelect} />
    {/if}
  </div>
  <div class='editor' bind:this={editorEl}></div>
</div>

<style>
  .wrapper, .editor {
    height: 100%;
  }
  .sep {
    width: 1px;
    height: 20px;
    background-color: #0003;
  }

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
