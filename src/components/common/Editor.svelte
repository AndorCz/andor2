<script>
  import { onMount, onDestroy } from 'svelte'
  import { Editor } from '@tiptap/core'
  import { Color } from '@tiptap/extension-color'
  import Link from '@tiptap/extension-link'
  import Image from '@tiptap/extension-image'
  import TextStyle from '@tiptap/extension-text-style'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import StarterKit from '@tiptap/starter-kit'
  import Underline from '@tiptap/extension-underline'
  import TextAlign from '@tiptap/extension-text-align'
  import Dropdown from '@components/common/Dropdown.svelte'
  import Colors from '@components/common/Colors.svelte'
  import { Details, DetailsSummary, DetailsContent } from '@lib/editor/details'
  import { Reply } from '@lib/editor/reply'

  export let content = ''

  let editor
  let editorEl
  let bubbleEl
  let currentStyle
  let currentAlign
  let showToolbelt = false

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
        Reply,
        Details.configure({ HTMLAttributes: { class: 'details' } }),
        DetailsSummary,
        DetailsContent,
        Image.configure(),
        Link.configure({ openOnClick: false }),
        Color.configure({ types: ['textStyle'] }),
        BubbleMenu.configure({ element: bubbleEl, tippyOptions: { maxWidth: 'none' } }),
        TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] })
      ],
      onTransaction: () => { editor = editor }, // force re-render so `editor.isActive` works as expected
      onSelectionUpdate: ({ editor }) => {
        // check for headings and paragraph
        const headingLevel = editor.getAttributes('heading').level
        currentStyle = headingLevel ? `heading${headingLevel}` : 'paragraph'
        // check for text alignment based on https://github.com/ueberdosis/tiptap/issues/4240#issuecomment-1673411677
        currentAlign = ['left', 'center', 'right', 'justify'].find((alignment) => editor.isActive({ textAlign: alignment }))
      },
      onFocus () { showToolbelt = true }
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

  function addImage () {
    const url = window.prompt('Veřejná cesta k obrázku:')
    if (url) { editor.chain().focus().setImage({ src: url }).run() }
  }

  export function addReply (postId, name, content) {
    editor.chain().focus().addReply({ postId, name, content }).run()
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
  <Colors />
  <div class='bubble' bind:this={bubbleEl}>
    {#if editor}
      <button on:click={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} class={editor.isActive('bold') ? 'material active' : 'material'} title='Tučně'>format_bold</button>
      <button on:click={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} class={editor.isActive('italic') ? 'material active' : 'material'} title='Kurzívou'>format_italic</button>
      <button on:click={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} class={editor.isActive('underline') ? 'material active' : 'material'} title='Podtrhnout'>format_underlined</button>
      <button on:click={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} class={editor.isActive('strike') ? 'material active' : 'material'} title='Přeškrtnout'>format_strikethrough</button>
      <button on:click={() => editor.chain().focus().setDetails().run()} class='material' title='Spoiler'>preview</button>
      <span><Dropdown iconsOnly current={currentStyle} defaultLabel='format_paragraph' options={styleOptions} on:select={handleStyleSelect} title='Styl' /></span>
      <span><Dropdown iconsOnly current={currentAlign} defaultLabel='format_align_left' options={alignOptions} on:select={handleAlignSelect} title='Zarovnání' /></span>
      <span class='sep'></span>
      <input class='button' type='color' list='presetColors' on:input={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color} title='Barva' />
      <button on:click={() => editor.chain().focus().unsetColor().run()} class='material' disabled={!editor.isActive('textStyle')} title='Reset barvy'>format_color_reset</button>
      <span class='sep'></span>
      <button on:click={setLink} class='material' title='Odkaz'>link</button>
      <button on:click={() => editor.chain().focus().unsetLink().run()} class='material' disabled={!editor.isActive('link')} title='Zrušit odkaz'>link_off</button>
    {/if}
  </div>
  <div class='editor' bind:this={editorEl}></div>
  {#if showToolbelt}
    <div class='toolbelt'>
      <button on:click={addImage} class='material' title='Obrázek'>image</button>
      <button on:click={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} class='material' title='Zpět'>undo</button>
      <button on:click={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} class='material' title='Znovu'>redo</button>
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
  }
  .wrapper, .editor {
    height: 100%;
  }

  .bubble {
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 7px;
    display: flex;
    align-items: center;
  }
    .sep {
      width: 1px;
      height: 22px;
      background-color: #0003;
      display: inline-block;
    }
    /*
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
    */
    .bubble button, .bubble span {
      margin: 3px;
    }
    .bubble button, .toolbelt button {
      padding: 5px;
    }
    .bubble button.active {
      background-color: var(--panel);
      border: 1px var(--panel) solid;
      box-shadow: inset 2px 2px 2px #0003;
    }
  .toolbelt {
    position: absolute;
    left: 10px;
    bottom: 10px;
    display: flex;
    gap: 10px;
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

  @media (max-width: 860px) {
    .bubble {
      display: block;
    }
    .sep {
      width: 40px;
      background-color: transparent;
    }
  }
</style>
