<script>
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import { Details, DetailsSummary, DetailsContent } from '@lib/editor/details'
  import { resizeImage, isFilledArray, getImageUrl } from '@lib/utils'
  import { Editor, mergeAttributes } from '@tiptap/core'
  import { EnterKeyHandler } from '@lib/editor/enter'
  import { MentionRender } from '@lib/editor/mention'
  import { CustomImage } from '@lib/editor/image'
  import { Color } from '@tiptap/extension-color'
  import { Reply } from '@lib/editor/reply'
  import { CustomHeading } from '@lib/editor/heading'
  import { CustomTextAlign } from '@lib/editor/alignment'
  import { FontSize } from '@lib/editor/size'
  import Link from '@tiptap/extension-link'
  import Image from '@tiptap/extension-image'
  import TextStyle from '@tiptap/extension-text-style'
  import FontFamily from '@tiptap/extension-font-family'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import StarterKit from '@tiptap/starter-kit'
  import Underline from '@tiptap/extension-underline'
  import Mention from '@tiptap/extension-mention'
  import Colors from '@components/common/Colors.svelte'
  import Dropdown from '@components/common/Dropdown.svelte'

  export let userId
  export let content = ''
  export let onKeyUp = null
  export let triggerSave = null
  export let onChange = null
  export let minHeight = 140
  export let enterSend = false
  export let fonts = null
  export let mentionList = []

  let editor
  let editorEl
  let bubbleEl
  let bubbleElImage
  let currentStyle
  let currentAlign = 'left'
  let isFocused = false
  let wasFocused = false
  // let debug = ''

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

  const fontOptions = [
    { value: 'sans-serif', label: "<span class='sansserif'>Bezpatkové</span>" },
    { value: 'monospace', label: "<span class='monospace'>Strojové</span>" },
    { value: 'cursive', label: "<span class='cursive'>Psané</span>" },
    { value: 'caveat', label: "<span class='caveat'>Caveat</span>" },
    { value: 'orbitron', label: "<span class='orbitron'>Orbitron</span>" }
  ]

  if (fonts) {
    fonts.forEach(font => {
      fontOptions.push({ value: font, label: `<span style='font-family: ${font}'>${font}</span>` })
    })
  }

  const BubbleMenuText = BubbleMenu.extend({ name: 'bubbleMenuText' })
  const BubbleMenuImage = BubbleMenu.extend({ name: 'bubbleMenuImage' })

  onMount(() => {
    const extensions = [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      Reply,
      EnterKeyHandler({ triggerSave, enterSend }),
      FontFamily.configure({ types: ['textStyle', 'bold', 'italic', 'underline', 'strike', 'heading', 'paragraph'] }),
      Details.configure({ HTMLAttributes: { class: 'details' } }),
      DetailsSummary,
      DetailsContent,
      Image.configure(),
      CustomImage,
      Link.configure({ openOnClick: false }),
      Color.configure({ types: ['textStyle', 'bold', 'italic', 'underline', 'strike', 'heading', 'paragraph'] }),
      BubbleMenuText.configure({
        pluginKey: 'bubbleMain',
        element: bubbleEl,
        tippyOptions: {
          maxWidth: 'none',
          onMount (instance) { instance.popper.querySelector('.tippy-box').classList.add('tippy-box-bubble') }
        },
        shouldShow: ({ editor, view }) => { // don't show for images
          const { selection } = editor.state
          const isImage = selection.node && selection.node.type.name === 'image'
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
          const isImage = selection.node && selection.node.type.name === 'image'
          return isImage
        }
      }),
      CustomHeading,
      CustomTextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify']
      })
    ]

    if (isFilledArray(mentionList)) {
      extensions.push(
        Mention.configure({
          HTMLAttributes: { class: 'mention' },
          suggestion: {
            items: ({ query }) => { return mentionList.filter(item => item.name.toLowerCase().startsWith(query.toLowerCase())) },
            render: MentionRender
          },
          renderHTML ({ options, node, HTMLAttributes }) {
            return [
              'span',
              mergeAttributes({ class: 'char_' + node.attrs.id }, options.HTMLAttributes),
              `${node.attrs.label}`
            ]
          }
        })
      )
    }

    const config = {
      element: editorEl,
      content,
      // ProseMirror events
      editorProps: {
        handleDrop: function (view, event, slice, moved) { // handle dropping of images
          if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
            uploadImage(event.dataTransfer.files[0]).then(({ data, img }) => {
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
              const node = view.state.schema.nodes.image.create({ src: getImageUrl(supabase, data.path, 'posts'), width: img.width, height: img.height })
              const transaction = view.state.tr.insert(coordinates.pos, node)
              view.dispatch(transaction)
            })
            return true
          }
          return false
        },
        handlePaste: function (view, event, slice) { // handle pasting of text and images
          /*
          if (event.clipboardData.types.indexOf('text/html') !== -1) { // parse HTML format
            const html = event.clipboardData.getData('text/html')
            editor.commands.insertContent(html)
            event.preventDefault()
            return true
          }
          */
          if (event.clipboardData.types.indexOf('text/plain') !== -1) { // parse plain text format (possibly with HTML content)
            let text = event.clipboardData.getData('text/plain')
            text = text.replace(/\n/g, '<br>') // replace newlines with line breaks
            if (editor.isEmpty) {
              editor.commands.insertContentAt(0, text, { parseOptions: { preserveWhitespace: true } })
            } else {
              editor.commands.insertContent(text, { parseOptions: { preserveWhitespace: true } })
            }
            event.preventDefault()
            return true
          }
          if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
            uploadImage(event.clipboardData.files[0]).then(({ data, img }) => {
              const { from } = view.state.selection
              const node = view.state.schema.nodes.image.create({ src: getImageUrl(supabase, data.path, 'posts'), width: img.width, height: img.height })
              const transaction = view.state.tr.insert(from, node)
              view.dispatch(transaction)
            })
            return true
          }
          return false
        }
      },
      extensions,
      onTransaction: () => { editor = editor }, // force re-render so `editor.isActive` works as expected
      onSelectionUpdate: ({ editor }) => {
        // check for headings and paragraph
        const headingLevel = editor.getAttributes('heading').level
        currentStyle = headingLevel ? `heading${headingLevel}` : 'paragraph'
        const alignments = ['left', 'center', 'right', 'justify']
        currentAlign = alignments.find(align => editor.isActive({ textAlign: align })) || 'left'
      },
      onFocus () {
        isFocused = true
        wasFocused = true
      },
      onBlur () { isFocused = false },
      onUpdate () {
        if (onKeyUp) { onKeyUp() }
        if (onChange) { onChange() }
        content = editor.state.doc.textContent
        // debug = JSON.stringify(editor.getJSON(), null, '\t')
      }
    }
    editor = new Editor(config)
    editorEl.querySelector('.ProseMirror').style.minHeight = minHeight + 'px'
  })

  onDestroy(() => { if (editor) { editor.destroy() } })

  export function getEditor () { return editor }

  export function setContent (newContent) {
    if (newContent !== '<p></p>') { // skip empty paragraph
      editor.commands.setContent(newContent)
    }
  }

  function handleStyleSelect (selectedOption) {
    switch (selectedOption.detail.value) {
      case 'heading1': editor.chain().focus().setHeading({ level: 1 }).run(); break
      case 'heading2': editor.chain().focus().setHeading({ level: 2 }).run(); break
      case 'heading3': editor.chain().focus().setHeading({ level: 3 }).run(); break
      default: editor.chain().focus().setParagraph().run()
    }
    currentStyle = selectedOption.detail.value
  }

  function handleAlignSelect (selectedOption) {
    editor.chain().focus().setTextAlign(selectedOption.detail.value).run()
    currentAlign = selectedOption.detail.value
  }

  function handleFontSelect (selectedOption) {
    editor.chain().focus().setFontFamily(selectedOption.detail.value).run()
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
      editor.chain().focus().setImage({ src: getImageUrl(supabase, data.path, 'posts'), width: img.width, height: img.height }).run()
    }
    fileInputEl.value = ''
  }

  export function addReply (postId, name, user) {
    editor.chain().focus().addReply({ postId, name, user }).run()
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

  function resetTextStyle () {
    editor.chain().focus().clearNodes().setParagraph().unsetAllMarks().run()
    // editor.chain().focus().unsetFontFamily().run()
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

<!-- <div id='debug' style='white-space: pre-wrap'>{debug}</div> -->

<div class='wrapper' class:isFocused>
  <Colors />
  <!-- Main bubble menu -->
  <div class='bubble' bind:this={bubbleEl}>
    {#if editor}
      <!-- buttons need to have type=button to not submit forms the editor might be in -->
      <span><Dropdown selected={currentStyle} defaultLabel='format_paragraph' iconsOnly options={styleOptions} on:select={handleStyleSelect} title='Styl' /></span>
      <span><Dropdown selected={currentAlign} defaultLabel='format_align_left' iconsOnly options={alignOptions} on:select={handleAlignSelect} title='Zarovnání' /></span>
      <span><Dropdown selected={editor.getAttributes('textStyle').fontFamily} defaultLabel='brand_family' options={fontOptions} on:select={handleFontSelect} title='Font' /></span>
      <span class='sep'></span>
      <button type='button' class='material' on:click={() => editor.chain().focus().decreaseSize().run()} disabled={!editor.can().chain().focus().decreaseSize().run()}>text_decrease</button>
      <button type='button' class='material' on:click={() => editor.chain().focus().increaseSize().run()} disabled={!editor.can().chain().focus().increaseSize().run()}>text_increase</button>
      <span class='sep'></span>
      <button type='button' on:click={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} class={editor.isActive('bold') ? 'material active' : 'material'} title='Tučně'>format_bold</button>
      <button type='button' on:click={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} class={editor.isActive('italic') ? 'material active' : 'material'} title='Kurzívou'>format_italic</button>
      <button type='button' on:click={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} class={editor.isActive('underline') ? 'material active' : 'material'} title='Podtrhnout'>format_underlined</button>
      <button type='button' on:click={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} class={editor.isActive('strike') ? 'material active' : 'material'} title='Přeškrtnout'>format_strikethrough</button>
      <button type='button' on:click={resetTextStyle} title='Reset stylů textu' class='material' disabled={!editor.getAttributes('textStyle').fontFamily}>format_clear</button>
      <span class='sep'></span>
      <button type='button' on:click={() => editor.chain().focus().setDetails().run()} class='material' title='Spoiler'>preview</button>
      <span class='sep'></span>
      <input type='color' class='button' list='presetColors' on:input={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color} title='Barva' />
      <button type='button' on:click={() => editor.chain().focus().unsetColor().run()} class='material' disabled={!editor.getAttributes('textStyle').color} title='Reset barvy'>format_color_reset</button>
      <span class='sep'></span>
      <button type='button' on:click={setLink} class='material' title='Odkaz'>link</button>
      <button type='button' on:click={() => editor.chain().focus().unsetLink().run()} class='material' disabled={!editor.isActive('link')} title='Zrušit odkaz'>link_off</button>
    {/if}
  </div>
  <!-- Image bubble menu -->
  <div class='bubble' bind:this={bubbleElImage}>
    {#if editor}
      <button type='button' on:click={() => editor.chain().focus().setImageAlignment('left').run()} class:active={editor.isActive('image', { alignment: 'left' })} title='Obtékat zprava' class='material'>format_image_left</button>
      <button type='button' on:click={() => editor.chain().focus().setImageAlignment('center').run()} class:active={editor.isActive('image', { alignment: 'center' })} title='Vycentrovat' class='material'>picture_in_picture_center</button>
      <button type='button' on:click={() => editor.chain().focus().setImageAlignment('right').run()} class:active={editor.isActive('image', { alignment: 'right' })} title='Obtékat zleva' class='material'>format_image_right</button>
      <span class='sep'></span>
      <button type='button' on:click={() => editor.chain().focus().decreaseImageSize().run()} disabled={editor.getAttributes('image').size <= 10} title='Zmenšit' class='material'>photo_size_select_small</button>
      <button type='button' on:click={() => editor.chain().focus().increaseImageSize().run()} disabled={editor.getAttributes('image').size >= 100} title='Zvětšit' class='material'>photo_size_select_large</button>
      <span class='sep'></span>
      <button type='button' on:click={() => editor.chain().focus().resetStyle().run()} title='Zrušit obtékání' class='material'>format_clear</button>
    {/if}
  </div>
  <div class='editor' bind:this={editorEl}></div>
  <div class='clear'></div>
  {#if wasFocused}
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
    border-bottom: 3px var(--buttonBg) solid;
    background-color: var(--inputBg);
    box-shadow: inset 1px 1px 6px #0006;
    border-radius: 10px;
  }
    .isFocused {
      outline: 2px var(--buttonBg) solid;
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
