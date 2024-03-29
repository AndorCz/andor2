<script>
  import { onMount, onDestroy } from 'svelte'
  import { Editor, Extension } from '@tiptap/core'
  import { supabase, handleError, getImage } from '@lib/database'
  import { Details, DetailsSummary, DetailsContent } from '@lib/editor/details'
  import { CustomImage } from '@lib/editor/image'
  import { resizeImage } from '@lib/utils'
  import { Color } from '@tiptap/extension-color'
  import { Reply } from '@lib/editor/reply'
  import Link from '@tiptap/extension-link'
  import Image from '@tiptap/extension-image'
  import TextStyle from '@tiptap/extension-text-style'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import StarterKit from '@tiptap/starter-kit'
  import Underline from '@tiptap/extension-underline'
  import TextAlign from '@tiptap/extension-text-align'
  import Dropdown from '@components/common/Dropdown.svelte'
  import Colors from '@components/common/Colors.svelte'

  export let userId
  export let content = ''
  export let onKeyUp = null
  export let triggerSave = null
  export let onChange = null
  export let minHeight = 140
  export let enterSend = false

  let editor
  let editorEl
  let bubbleEl
  let bubbleElImage
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

  const EnterKeyHandler = Extension.create({
    name: 'enterKeyHandler',
    addKeyboardShortcuts () {
      return {
        Enter: () => {
          if (enterSend) {
            if (!this.editor.isActive('code') && !event.shiftKey) { // trigger save when Shift is not pressed
              if (!this.editor.isEmpty) { triggerSave() }
              return true // prevents the default enter behavior
            }
          }
          return false // allows the default behavior (new line) when Shift is pressed
        }
      }
    }
  })

  const BubbleMenuText = BubbleMenu.extend({ name: 'bubbleMenuText' })
  const BubbleMenuImage = BubbleMenu.extend({ name: 'bubbleMenuImage' })

  onMount(() => {
    const config = {
      element: editorEl,
      content,
      // ProseMirror events
      editorProps: {
        handleDrop: function (view, event, slice, moved) { // handle dropping of images
          if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
            uploadImage(event.dataTransfer.files[0]).then(({ data, img }) => {
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
              const node = view.state.schema.nodes.customImage.create({ src: getImage(data.path, 'posts'), width: img.width, height: img.height })
              const transaction = view.state.tr.insert(coordinates.pos, node)
              view.dispatch(transaction)
            })
            return true
          }
          return false
        },
        handlePaste: function (view, event, slice) { // handle pasting of images
          if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
            uploadImage(event.clipboardData.files[0]).then(({ data, img }) => {
              const { from } = view.state.selection
              const node = view.state.schema.nodes.customImage.create({ src: getImage(data.path, 'posts'), width: img.width, height: img.height })
              const transaction = view.state.tr.insert(from, node)
              view.dispatch(transaction)
            })
            return true
          }
          return false
        }
      },
      extensions: [
        StarterKit,
        EnterKeyHandler,
        Underline,
        TextStyle,
        Reply,
        Details.configure({ HTMLAttributes: { class: 'details' } }),
        DetailsSummary,
        DetailsContent,
        Image.configure(),
        CustomImage,
        Link.configure({ openOnClick: false }),
        Color.configure({ types: ['textStyle'] }),
        BubbleMenuText.configure({
          pluginKey: 'bubbleMain',
          element: bubbleEl,
          tippyOptions: {
            maxWidth: 'none',
            onMount (instance) { instance.popper.querySelector('.tippy-box').classList.add('tippy-box-bubble') }
          },
          shouldShow: ({ editor, view }) => { // don't show for images
            const { selection } = editor.state
            const isImage = selection.node && selection.node.type.name === 'customImage'
            return !selection.empty && !isImage
          }
        }),
        BubbleMenuImage.configure({
          pluginKey: 'bubbleImage',
          element: bubbleElImage,
          tippyOptions: {
            maxWidth: 'none',
            onMount (instance) { instance.popper.querySelector('.tippy-box').classList.add('tippy-box-bubble') }
          },
          shouldShow: ({ editor, view }) => { // only show for images
            const { selection } = editor.state
            const isImage = selection.node && selection.node.type.name === 'customImage'
            return isImage
          }
        }),
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
      onFocus () { showToolbelt = true },
      onUpdate () {
        if (onKeyUp) { onKeyUp() }
        if (onChange) { onChange() }
        content = editor.state.doc.textContent
      }
    }
    editor = new Editor(config)
    editorEl.querySelector('.ProseMirror').style.minHeight = minHeight + 'px'
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

  /*
  function addImage () {
    const url = window.prompt('Veřejná cesta k obrázku:')
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      editor.chain().focus().setImage({ src: url }).run()
    } else {
      return window.alert('Obrázek musí být veřejně dostupný')
    }
  }
  */

  async function addImage () {
    const fileInputEl = document.getElementById('addImage')
    const file = fileInputEl.files[0]
    if (file) {
      const { data, img } = await uploadImage(file)
      editor.chain().focus().setImage({ src: getImage(data.path, 'posts'), width: img.width, height: img.height }).run()
    }
    fileInputEl.value = ''
  }

  export function addReply (postId, name) {
    editor.chain().focus().addReply({ postId, name }).run()
  }

  async function uploadImage (file) {
    const img = document.createElement('img')
    img.src = URL.createObjectURL(file)
    await new Promise(resolve => { img.onload = resolve }) // wait for the image to load
    if (img.width > 2000 || img.height > 2000) {
      const resizedBlob = await resizeImage(img, 2000, 2000, 'image/jpeg')
      file = new File([resizedBlob], file.name, { type: 'image/jpeg' }) // blob to file
    }
    const { data, error } = await supabase.storage.from('posts').upload(`${userId}/${new Date().getTime()}.png`, file)
    if (error) { handleError(error) }
    return { data, img }
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
  <!-- Main bubble menu -->
  <div class='bubble' bind:this={bubbleEl}>
    {#if editor}
      <!-- buttons need to have type=button to not submit forms the editor might be in -->
      <button type='button' on:click={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} class={editor.isActive('bold') ? 'material active' : 'material'} title='Tučně'>format_bold</button>
      <button type='button' on:click={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} class={editor.isActive('italic') ? 'material active' : 'material'} title='Kurzívou'>format_italic</button>
      <button type='button' on:click={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} class={editor.isActive('underline') ? 'material active' : 'material'} title='Podtrhnout'>format_underlined</button>
      <button type='button' on:click={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} class={editor.isActive('strike') ? 'material active' : 'material'} title='Přeškrtnout'>format_strikethrough</button>
      <button type='button' on:click={() => editor.chain().focus().setDetails().run()} class='material' title='Spoiler'>preview</button>
      <span><Dropdown iconsOnly current={currentStyle} defaultLabel='format_paragraph' options={styleOptions} on:select={handleStyleSelect} title='Styl' /></span>
      <span><Dropdown iconsOnly current={currentAlign} defaultLabel='format_align_left' options={alignOptions} on:select={handleAlignSelect} title='Zarovnání' /></span>
      <span class='sep'></span>
      <input type='color' class='button' list='presetColors' on:input={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color} title='Barva' />
      <button type='button' on:click={() => editor.chain().focus().unsetColor().run()} class='material' disabled={!editor.isActive('textStyle')} title='Reset barvy'>format_color_reset</button>
      <span class='sep'></span>
      <button type='button' on:click={setLink} class='material' title='Odkaz'>link</button>
      <button type='button' on:click={() => editor.chain().focus().unsetLink().run()} class='material' disabled={!editor.isActive('link')} title='Zrušit odkaz'>link_off</button>
    {/if}
  </div>
  <!-- Image bubble menu -->
  <div class='bubble' bind:this={bubbleElImage}>
    {#if editor}
      <button type='button' on:click={() => editor.chain().focus().setImageAlignment('left').run()} class:active={editor.isActive('customImage', { alignment: 'left' })} title='Obtékat zprava' class='material'>format_image_left</button>
      <button type='button' on:click={() => editor.chain().focus().setImageAlignment('right').run()} class:active={editor.isActive('customImage', { alignment: 'right' })} title='Obtékat zleva' class='material'>format_image_right</button>
      <span class='sep'></span>
      <button type='button' on:click={() => editor.chain().focus().decreaseImageSize().run()} disabled={editor.getAttributes('customImage').size <= 20} title='Zmenšit' class='material'>photo_size_select_small</button>
      <button type='button' on:click={() => editor.chain().focus().increaseImageSize().run()} disabled={editor.getAttributes('customImage').size >= 200} title='Zvětšit' class='material'>photo_size_select_large</button>
      <span class='sep'></span>
      <button type='button' on:click={() => editor.chain().focus().resetStyle().run()} title='Zrušit obtékání' class='material'>format_clear</button>
    {/if}
  </div>
  <div class='editor' bind:this={editorEl}></div>
  {#if showToolbelt}
    <div class='toolbelt'>
      <label for='addImage' class='material button' title='Obrázek'>image</label>
      <input on:change={addImage} accept='image/*' type='file' id='addImage'>
      <button type='button' on:click={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} class='material' title='Zpět'>undo</button>
      <button type='button' on:click={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} class='material' title='Znovu'>redo</button>
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
  label {
    padding: 5px;
  }
  .bubble {
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 7px;
    display: flex;
    align-items: center;
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
  .toolbelt {
    position: absolute;
    left: 10px;
    bottom: 10px;
    display: flex;
    gap: 10px;
  }
  #addImage {
    display: none;
  }

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
