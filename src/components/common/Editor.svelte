<script>
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import { showSuccess } from '@lib/toasts'
  import { Details, DetailsSummary, DetailsContent } from '@lib/editor/details'
  import { resizeImage, getImageUrl } from '@lib/utils'
  import { EnterKeyHandler } from '@lib/editor/enter'
  import { MentionRender } from '@lib/editor/mentionRender'
  import { Mention } from '@lib/editor/mention'
  import { CustomImage } from '@lib/editor/image'
  import { CustomColor } from '@lib/editor/color'
  import { Reply } from '@lib/editor/reply'
  import { FontSize } from '@lib/editor/size'
  import { CustomHeading } from '@lib/editor/heading'
  import { CustomTextAlign } from '@lib/editor/alignment'
  import { Editor, mergeAttributes } from '@tiptap/core'
  import { platform } from '@components/common/MediaQuery.svelte'
  import Link from '@tiptap/extension-link'
  import Image from '@tiptap/extension-image'
  import TextStyle from '@tiptap/extension-text-style'
  import FontFamily from '@tiptap/extension-font-family'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import StarterKit from '@tiptap/starter-kit'
  import Underline from '@tiptap/extension-underline'
  import Youtube from '@tiptap/extension-youtube'
  import Colors from '@components/common/Colors.svelte'
  import DropdownSlot from '@components/common/DropdownSlot.svelte'
  import EditorMenu from '@components/common/EditorMenu.svelte'

  export let user
  export let value = ''
  export let onKeyUp = null
  export let triggerSave = null
  export let onChange = null
  export let minHeight = 140
  export let enterSend = false
  export let fonts = null
  export let mentionList = null
  export let forceBubble = false
  export let singleLine = false

  let editor
  let editorEl
  let menuEl
  let isBubble = true
  let bubbleElImage
  let isFocused = false
  let wasFocused = false
  let timeout
  // let debug = ''

  onMount(() => {
    const BubbleMenuImage = BubbleMenu.extend({ name: 'bubbleMenuImage' })
    const extensions = [
      TextStyle,
      StarterKit,
      Underline,
      FontSize,
      Reply,
      Youtube,
      EnterKeyHandler({ triggerSave, enterSend }),
      FontFamily.configure({ types: ['textStyle', 'bold', 'italic', 'underline', 'strike', 'heading', 'paragraph'] }),
      Details.configure({ HTMLAttributes: { class: 'details' } }),
      DetailsSummary,
      DetailsContent,
      Image.configure(),
      CustomImage,
      Link.configure({ openOnClick: false }),
      CustomColor.configure({ types: ['textStyle', 'bold', 'italic', 'underline', 'strike', 'heading', 'paragraph'] }),
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

    if (forceBubble) {
      isBubble = true
      const BubbleMenuText = BubbleMenu.extend({ name: 'bubbleMenuText' })
      extensions.push(
        BubbleMenuText.configure({
          pluginKey: 'bubbleMain',
          element: menuEl,
          tippyOptions: {
            maxWidth: 'none',
            onMount (instance) { instance.popper.querySelector('.tippy-box').classList.add('tippy-box-bubble') }
          },
          shouldShow: ({ editor, view }) => { // don't show for images
            const { selection } = editor.state
            const isImage = selection.node && selection.node.type.name === 'image'
            return !selection.empty && !isImage
          }
        })
      )
    } else {
      isBubble = false
    }

    if ($mentionList) {
      extensions.push(
        Mention.configure({
          HTMLAttributes: { class: 'mention' },
          suggestion: {
            items: ({ query }) => { return $mentionList.filter(item => item.name.toLowerCase().startsWith(query.toLowerCase())) },
            render: MentionRender
          },
          renderHTML ({ options, node, HTMLAttributes }) {
            const type = node.attrs.type === 'character' ? 'char' : 'user'
            const url = node.attrs.type === 'character' ? `/game/character?id=${node.attrs.id}` : `/user?id=${node.attrs.id}`
            const label = node.attrs.type === 'character' ? node.attrs.label : '@' + node.attrs.label
            const classes = `mention ${node.attrs.type} ${type}_${node.attrs.id}`
            return ['a', mergeAttributes({ href: url, class: classes }, options.HTMLAttributes), label]
          }
        })
      )
    }

    const config = {
      element: editorEl,
      // content: value,
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
          // paste image from clipboard
          if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
            uploadImage(event.clipboardData.files[0]).then(({ data, img }) => {
              const { from } = view.state.selection
              const node = view.state.schema.nodes.image.create({ src: getImageUrl(supabase, data.path, 'posts'), width: img.width, height: img.height })
              const transaction = view.state.tr.insert(from, node)
              view.dispatch(transaction)
            })
            return true
          }
          // parse HTML format
          if (event.clipboardData.types.indexOf('text/html') !== -1) {
            const html = event.clipboardData.getData('text/html')
            editor.commands.insertContent(html)
            event.preventDefault()
            showSuccess('Vložen obsah s formátovám dle zdrojové stránky. Pro čistý text použij ctrl/cmd + shift + v')
            return true
          }
          // parse plain text format (possibly with HTML content)
          if (event.clipboardData.types.indexOf('text/plain') !== -1) {
            let text = event.clipboardData.getData('text/plain')

            // return false (default handling) if the pasted text is an url, with a regexp
            if (text.match(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i)) { return false }

            text = text.replace(/\n/g, '<br>') // replace newlines with line breaks
            if (editor.isEmpty) {
              editor.commands.insertContentAt(0, text, { parseOptions: { preserveWhitespace: true } })
            } else {
              editor.commands.insertContent(text, { parseOptions: { preserveWhitespace: true } })
            }
            event.preventDefault()
            return true
          }
          return false
        }
      },
      extensions,
      onTransaction: () => { editor = editor }, // force re-render so `editor.isActive` works as expected
      onFocus () {
        isFocused = true
        wasFocused = true
      },
      onBlur () { isFocused = false },
      onUpdate () {
        if (onKeyUp) { onKeyUp() }
        if (onChange) {
          setValue() // update content after a delay
          onChange()
        }
        // value = editor.state.doc.textContent
        // debug = JSON.stringify(editor.getJSON(), null, '\t')
      }
    }
    editor = new Editor(config)
    editorEl.querySelector('.ProseMirror').style.minHeight = minHeight + 'px'
  })

  function setValue () {
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      value = await editor.getHTML()
    }, 50) // Delay in ms, adjust as needed
  }

  onDestroy(() => { if (editor) { editor.destroy() } })

  export function getEditor () { return editor }

  export function setContent (newContent) {
    if (newContent !== '<p></p>') { // skip empty paragraph
      editor.commands.setContent(newContent)
    }
  }

  async function addImageStored () {
    const fileInputEl = document.getElementById('addImageStored')
    const file = fileInputEl.files[0]
    if (file) {
      const { data, img } = await uploadImage(file)
      editor.chain().focus().setImage({ src: getImageUrl(supabase, data.path, 'posts'), width: img.width, height: img.height }).run()
    }
    fileInputEl.value = ''
  }

  function addImageUrl () {
    const url = window.prompt('Veřejná cesta k obrázku:')
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      editor.chain().focus().setImage({ src: url }).run()
    } else {
      return window.alert('Obrázek musí být veřejně dostupný')
    }
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
    const { data, error } = await supabase.storage.from('posts').upload(`${user.id}/${new Date().getTime()}.png`, file)
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

<!--<div id='debug' style='white-space: pre-wrap'>{debug}</div>-->

<Colors {user} />

{#if $platform === 'desktop'}
  <div class='menuWrapper sticky' bind:this={menuEl}>
    <EditorMenu {fonts} {editor} {isBubble} />
  </div>
{/if}

<div class:isFocused class='inner' class:useBubble={isBubble}>
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
  <div class='editor' bind:this={editorEl} class:singleLine></div>
  <div class='clear'></div>
  {#if wasFocused && !singleLine}
    <div class='toolbelt'>
      <input on:change={addImageStored} accept='image/*' type='file' id='addImageStored'>
      <DropdownSlot title='Obrázek' defaultLabel='image' openUp>
        <label class='button text' for='addImageStored'>Nahrát z počítače</label>
        <button type='button' on:click={addImageUrl} class='text'>Cesta z internetu</button>
      </DropdownSlot>
      <button type='button' on:click={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} class='material' title='Zpět'>undo</button>
      <button type='button' on:click={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} class='material' title='Znovu'>redo</button>
    </div>
  {/if}
</div>

{#if $platform === 'mobile'}
  <div class='menuWrapper stickyBottom' bind:this={menuEl}>
    <EditorMenu {fonts} {editor} {isBubble} isBottom />
  </div>
{/if}

<style>
  .inner {
    position: relative;
    border-bottom: 3px var(--buttonBg) solid;
    background-color: var(--inputBg);
    box-shadow: inset 1px 1px 6px #0006;
    border-radius: 10px;
    margin-top: 2px;
  }
    .useBubble {
      height: 100%;
    }
    .isFocused {
      outline: 2px var(--buttonBg) solid;
    }
  .editor {
    height: 100%;
  }
  label {
    padding: 5px;
  }

  .menuWrapper.sticky {
    position: sticky;
    top: 0px;
    z-index: 9;
  }

  .bubble {
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 7px;
    display: flex;
    align-items: center;
  }
    .bubble button, .bubble span {
      margin: 3px;
    }
    .bubble button, .toolbelt button {
      padding: 5px;
    }
    button.text, label.text {
      padding: 10px;
    }

  .toolbelt {
    position: absolute;
    left: 10px;
    bottom: 10px;
    display: flex;
    gap: 10px;
  }

  #addImageStored {
    display: none;
  }

  @media (max-width: 860px) {
    .bubble {
      display: block;
    }
  }

  @media (max-width: 720px) {
    .menuWrapper.stickyBottom {
      position: sticky;
      bottom: 0px;
    }
  }
</style>
