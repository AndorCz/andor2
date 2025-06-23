<script>
  import Dropdown from '@components/common/Dropdown.svelte'

  const { fonts, editor, isBubble = false, isBottom = false } = $props()

  let menuEl

  const editorState = $state({
    headingLevel: undefined,
    textAlign: 'left',
    fontFamily: undefined,
    canDecreaseSize: false,
    canIncreaseSize: false,
    isBold: false,
    canToggleBold: false,
    isItalic: false,
    canToggleItalic: false,
    isUnderline: false,
    canToggleUnderline: false,
    isStrike: false,
    canToggleStrike: false,
    isSelectionEmpty: true,
    color: undefined,
    isLink: false
  })

  $effect(() => {
    if (editor) {
      const handler = () => {
        editorState.headingLevel = editor.getAttributes('heading').level
        const alignments = ['left', 'center', 'right', 'justify']
        editorState.textAlign = alignments.find(align => editor.isActive({ textAlign: align })) || 'left'
        editorState.fontFamily = editor.getAttributes('textStyle').fontFamily
        editorState.canDecreaseSize = editor.can().chain().focus().decreaseSize().run()
        editorState.canIncreaseSize = editor.can().chain().focus().increaseSize().run()
        editorState.isBold = editor.isActive('bold')
        editorState.canToggleBold = editor.can().chain().focus().toggleBold().run()
        editorState.isItalic = editor.isActive('italic')
        editorState.canToggleItalic = editor.can().chain().focus().toggleItalic().run()
        editorState.isUnderline = editor.isActive('underline')
        editorState.canToggleUnderline = editor.can().chain().focus().toggleUnderline().run()
        editorState.isStrike = editor.isActive('strike')
        editorState.canToggleStrike = editor.can().chain().focus().toggleStrike().run()
        editorState.isSelectionEmpty = editor.state.selection.empty
        editorState.color = editor.getAttributes('textStyle').color
        editorState.isLink = editor.isActive('link')
      }
      editor.on('selectionUpdate', handler)
      handler() // set initial state

      return () => {
        editor.off('selectionUpdate', handler)
      }
    }
  })

  const currentStyle = $derived(editorState.headingLevel ? `heading${editorState.headingLevel}` : 'paragraph')
  const currentAlign = $derived(editorState.textAlign)

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

  const baseFontOptions = [
    { value: 'sans-serif', label: "<span class='sansserif'>Bezpatkové</span>" },
    { value: 'monospace', label: "<span class='monospace'>Strojové</span>" },
    { value: '"Lucida Handwriting", cursive', label: "<span class='cursive'>Psané</span>" },
    { value: 'caveat', label: "<span class='caveat'>Caveat</span>" },
    { value: 'orbitron', label: "<span class='orbitron'>Orbitron</span>" }
  ]

  const fontOptions = $derived(fonts ? [...baseFontOptions, ...fonts.map(font => ({ value: font, label: `<span style='font-family: ${font}'>${font}</span>` }))] : baseFontOptions)

  function handleStyleSelect (selectedOption) {
    switch (selectedOption.detail.value) {
      case 'heading1': editor.chain().focus().setHeading({ level: 1 }).run(); break
      case 'heading2': editor.chain().focus().setHeading({ level: 2 }).run(); break
      case 'heading3': editor.chain().focus().setHeading({ level: 3 }).run(); break
      default: editor.chain().focus().setParagraph().run()
    }
  }

  function handleAlignSelect (selectedOption) {
    editor.chain().focus().setTextAlign(selectedOption.detail.value).run()
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
    <span><Dropdown openUp={isBottom} selected={editorState.fontFamily} defaultLabel='brand_family' options={fontOptions} on:select={handleFontSelect} title='Font' /></span>
    <span class='sep'></span>
    <button type='button' class='material' onclick={() => editor.chain().focus().decreaseSize().run()} disabled={!editorState.canDecreaseSize}>text_decrease</button>
    <button type='button' class='material' onclick={() => editor.chain().focus().increaseSize().run()} disabled={!editorState.canIncreaseSize}>text_increase</button>
    <span class='sep'></span>
    <button type='button' onclick={() => editor.chain().focus().toggleBold().run()} disabled={!editorState.canToggleBold} class={editorState.isBold ? 'material active' : 'material'} title='Tučně'>format_bold</button>
    <button type='button' onclick={() => editor.chain().focus().toggleItalic().run()} disabled={!editorState.canToggleItalic} class={editorState.isItalic ? 'material active' : 'material'} title='Kurzívou'>format_italic</button>
    <button type='button' onclick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editorState.canToggleUnderline} class={editorState.isUnderline ? 'material active' : 'material'} title='Podtrhnout'>format_underlined</button>
    <button type='button' onclick={() => editor.chain().focus().toggleStrike().run()} disabled={!editorState.canToggleStrike} class={editorState.isStrike ? 'material active' : 'material'} title='Přeškrtnout'>format_strikethrough</button>
    <button type='button' onclick={resetTextStyle} title='Reset stylů textu' class='material' disabled={editorState.isSelectionEmpty}>format_clear</button>
    <span class='sep'></span>
    <button type='button' onclick={() => editor.chain().focus().setDetails().run()} class='material' title='Spoiler'>preview</button>
    <span class='sep'></span>
    <input type='color' class='button' list='presetColors' oninput={event => editor.chain().focus().setColor(event.target.value).run()} value={editorState.color || '#c4b6ab'} title='Barva' />
    <button type='button' onclick={() => editor.chain().focus().unsetColor().run()} class='material' disabled={!editorState.color} title='Reset barvy'>format_color_reset</button>
    <span class='sep'></span>
    <button type='button' onclick={setLink} class='material' title='Odkaz'>link</button>
    <button type='button' onclick={() => editor.chain().focus().unsetLink().run()} class='material' disabled={!editorState.isLink} title='Zrušit odkaz'>link_off</button>
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
