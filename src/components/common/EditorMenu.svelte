<script>
  import { beforeUpdate, onDestroy } from 'svelte'
  import Dropdown from '@components/common/Dropdown.svelte'

  export let editor
  export let fonts
  export let isBubble = false
  export let isBottom = false

  let isInitialized = false
  let currentStyle
  let currentAlign = 'left'
  let menuEl

  beforeUpdate(() => {
    if (editor && !isInitialized) {
      editor.on('selectionUpdate', () => {
        // check for headings and paragraph
        const headingLevel = editor.getAttributes('heading').level
        currentStyle = headingLevel ? `heading${headingLevel}` : 'paragraph'
        const alignments = ['left', 'center', 'right', 'justify']
        currentAlign = alignments.find(align => editor.isActive({ textAlign: align })) || 'left'
      })
      isInitialized = true
    }
  })

  onDestroy(() => { editor.off('selectionUpdate') })

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
    { value: '"Lucida Handwriting", cursive', label: "<span class='cursive'>Psané</span>" },
    { value: 'caveat', label: "<span class='caveat'>Caveat</span>" },
    { value: 'orbitron', label: "<span class='orbitron'>Orbitron</span>" }
  ]

  if (fonts) {
    fonts.forEach(font => {
      fontOptions.push({ value: font, label: `<span style='font-family: ${font}'>${font}</span>` })
    })
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

  function resetTextStyle () {
    editor.chain().focus().clearNodes().setParagraph().unsetAllMarks().run()
    // editor.chain().focus().unsetFontFamily().run()
  }
</script>

<div class='menu' class:bubble={isBubble} bind:this={menuEl}>
  {#if editor}
    <!-- buttons need to have type=button to not submit forms the editor might be in -->
    <span><Dropdown openUp={isBottom} selected={currentStyle} defaultLabel='format_paragraph' iconsOnly options={styleOptions} on:select={handleStyleSelect} title='Styl' /></span>
    <span><Dropdown openUp={isBottom} selected={currentAlign} defaultLabel='format_align_left' iconsOnly options={alignOptions} on:select={handleAlignSelect} title='Zarovnání' /></span>
    <span><Dropdown openUp={isBottom} selected={editor.getAttributes('textStyle').fontFamily} defaultLabel='brand_family' options={fontOptions} on:select={handleFontSelect} title='Font' /></span>
    <span class='sep'></span>
    <button type='button' class='material' on:click={() => editor.chain().focus().decreaseSize().run()} disabled={!editor.can().chain().focus().decreaseSize().run()}>text_decrease</button>
    <button type='button' class='material' on:click={() => editor.chain().focus().increaseSize().run()} disabled={!editor.can().chain().focus().increaseSize().run()}>text_increase</button>
    <span class='sep'></span>
    <button type='button' on:click={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} class={editor.isActive('bold') ? 'material active' : 'material'} title='Tučně'>format_bold</button>
    <button type='button' on:click={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} class={editor.isActive('italic') ? 'material active' : 'material'} title='Kurzívou'>format_italic</button>
    <button type='button' on:click={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} class={editor.isActive('underline') ? 'material active' : 'material'} title='Podtrhnout'>format_underlined</button>
    <button type='button' on:click={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} class={editor.isActive('strike') ? 'material active' : 'material'} title='Přeškrtnout'>format_strikethrough</button>
    <button type='button' on:click={resetTextStyle} title='Reset stylů textu' class='material' disabled={editor.state.selection.empty}>format_clear</button>
    <span class='sep'></span>
    <button type='button' on:click={() => editor.chain().focus().setDetails().run()} class='material' title='Spoiler'>preview</button>
    <span class='sep'></span>
    <input type='color' class='button' list='presetColors' on:input={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color || '#c4b6ab'} title='Barva' />
    <button type='button' on:click={() => editor.chain().focus().unsetColor().run()} class='material' disabled={!editor.getAttributes('textStyle').color} title='Reset barvy'>format_color_reset</button>
    <span class='sep'></span>
    <button type='button' on:click={setLink} class='material' title='Odkaz'>link</button>
    <button type='button' on:click={() => editor.chain().focus().unsetLink().run()} class='material' disabled={!editor.isActive('link')} title='Zrušit odkaz'>link_off</button>
  {/if}
</div>

<style>
  .menu {
    white-space: nowrap;
    height: 50px;
    overflow-y: hidden;
    overflow-x: auto;
    align-items: center;
    display: flex;
    width: 100%;
    background-color: var(--panel);
  }
  .bubble {
    background-color: color-mix(in srgb, var(--panel), #FFF 5%);
    box-shadow: 2px 2px 2px #0003;
    border-radius: 15px;
    padding: 7px;
    display: flex;
    align-items: center;
  }
    .bubble button, .bubble span, .menu button, .menu .button, .menu span, .bubble .button {
      margin: 3px;
    }
    .bubble button, .menu button {
      padding: 5px;
    }
</style>
