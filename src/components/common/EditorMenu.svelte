<script>
  import { onDestroy } from 'svelte'
  import Dropdown from '@components/common/Dropdown.svelte'

  const { editor, fonts, isBubble = false, isBottom = false } = $props()
  const alignments = ['left', 'center', 'right', 'justify']
  const defaultColor = '#c4b6ab'

  let menuEl = $state()
  let currentStyle = $state()
  let isInitialized = $state(false)
  let currentAlign = $state(alignments[0])
  let currentColor = $state(defaultColor)
  let currentFont = $state()
  let isUnderline = $state(false)
  let isItalic = $state(false)
  let isStrike = $state(false)
  let isBold = $state(false)
  let isLink = $state(false)
  let selectionEmpty = $state(0)
  let canDecrease = $state(true)
  let canIncrease = $state(true)
  let canToggleBold = $state(true)
  let canToggleItalic = $state(true)
  let canToggleUnderline = $state(true)
  let canToggleStrike = $state(true)

  $effect(() => {
    if (editor && !isInitialized) {
      editor.on('selectionUpdate', updateStyles)
      editor.on('update', updateStyles)
      isInitialized = true
    }
  })

  onDestroy(() => {
    if (editor) { editor.off('selectionUpdate') }
  })

  async function updateStyles () {
    // update current styles
    const headingLevel = editor.getAttributes('heading').level
    currentStyle = headingLevel ? `heading${headingLevel}` : 'paragraph'
    currentAlign = alignments.find(align => editor.isActive({ textAlign: align })) || alignments[0]
    currentColor = editor.getAttributes('textStyle').color || defaultColor
    currentFont = editor.getAttributes('textStyle').fontFamily
    isBold = editor.isActive('bold')
    isItalic = editor.isActive('italic')
    isUnderline = editor.isActive('underline')
    isStrike = editor.isActive('strike')
    isLink = editor.isActive('link')
    selectionEmpty = editor.state.selection.empty
    canDecrease = editor.can().chain().focus().decreaseSize().run()
    canIncrease = editor.can().chain().focus().increaseSize().run()
    canToggleBold = editor.can().chain().focus().toggleBold().run()
    canToggleItalic = editor.can().chain().focus().toggleItalic().run()
    canToggleUnderline = editor.can().chain().focus().toggleUnderline().run()
    canToggleStrike = editor.can().chain().focus().toggleStrike().run()
  }

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

  const fontOptions = $derived.by(() => {
    const options = [
      { value: 'sans-serif', label: "<span class='sansserif'>Bezpatkové</span>" },
      { value: 'monospace', label: "<span class='monospace'>Strojové</span>" },
      { value: '"Lucida Handwriting", cursive', label: "<span class='cursive'>Psané</span>" },
      { value: 'caveat', label: "<span class='caveat'>Caveat</span>" },
      { value: 'orbitron', label: "<span class='orbitron'>Orbitron</span>" }
    ]

    if (fonts) {
      fonts.forEach(font => {
        options.push({ value: font, label: `<span style='font-family: ${font}'>${font}</span>` })
      })
    }

    return options
  })

  function handleStyleSelect (selectedOption) {
    switch (selectedOption.value) {
      case 'heading1': editor.chain().focus().setHeading({ level: 1 }).run(); break
      case 'heading2': editor.chain().focus().setHeading({ level: 2 }).run(); break
      case 'heading3': editor.chain().focus().setHeading({ level: 3 }).run(); break
      default: editor.chain().focus().setParagraph().run()
    }
    currentStyle = selectedOption.value
  }

  function handleAlignSelect (selectedOption) {
    editor.chain().focus().setTextAlign(selectedOption.value).run()
    currentAlign = selectedOption.value
  }

  function handleFontSelect (selectedOption) {
    editor.chain().focus().setFontFamily(selectedOption.value).run()
    currentFont = selectedOption.value
  }

  function setLink () {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url) {
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        isLink = false
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        isLink = true
      }
    }
  }

  function resetTextStyle () {
    editor.chain().focus().clearNodes().setParagraph().unsetAllMarks().run()
    // Update states immediately
    currentStyle = 'paragraph'
    isBold = false
    isItalic = false
    isUnderline = false
    isStrike = false
    currentColor = defaultColor
  }
</script>

<div class='menu' class:bubble={isBubble} bind:this={menuEl}>
  {#if editor}
    <!-- buttons need to have type=button to not submit forms the editor might be in -->
    <span><Dropdown openUp={isBottom} selected={currentStyle} defaultLabel='format_paragraph' iconsOnly options={styleOptions} onselect={handleStyleSelect} title='Styl' /></span>
    <span><Dropdown openUp={isBottom} selected={currentAlign} defaultLabel='format_align_left' iconsOnly options={alignOptions} onselect={handleAlignSelect} title='Zarovnání' /></span>
    <span><Dropdown openUp={isBottom} selected={currentFont} defaultLabel='brand_family' options={fontOptions} onselect={handleFontSelect} title='Font' /></span>
    <span class='sep'></span>
    <button type='button' class='material' onclick={() => editor.chain().focus().decreaseSize().run()} disabled={!canDecrease}>text_decrease</button>
    <button type='button' class='material' onclick={() => editor.chain().focus().increaseSize().run()} disabled={!canIncrease}>text_increase</button>
    <span class='sep'></span>
    <button type='button' onclick={() => { editor.chain().focus().toggleBold().run(); isBold = !isBold }} disabled={!canToggleBold} class={isBold ? 'material active' : 'material'} title='Tučně'>format_bold</button>
    <button type='button' onclick={() => { editor.chain().focus().toggleItalic().run(); isItalic = !isItalic }} disabled={!canToggleItalic} class={isItalic ? 'material active' : 'material'} title='Kurzívou'>format_italic</button>
    <button type='button' onclick={() => { editor.chain().focus().toggleUnderline().run(); isUnderline = !isUnderline }} disabled={!canToggleUnderline} class={isUnderline ? 'material active' : 'material'} title='Podtrhnout'>format_underlined</button>
    <button type='button' onclick={() => { editor.chain().focus().toggleStrike().run(); isStrike = !isStrike }} disabled={!canToggleStrike} class={isStrike ? 'material active' : 'material'} title='Přeškrtnout'>format_strikethrough</button>
    <button type='button' onclick={resetTextStyle} title='Reset stylů textu' class='material' disabled={selectionEmpty}>format_clear</button>
    <span class='sep'></span>
    <button type='button' onclick={() => editor.chain().focus().setDetails().run()} class='material' title='Spoiler'>preview</button>
    <span class='sep'></span>
    <input type='color' class='button' list='presetColors' oninput={event => { editor.chain().focus().setColor(event.target.value).run(); currentColor = event.target.value }} value={currentColor} title='Barva' />
    <button type='button' onclick={() => { editor.chain().focus().unsetColor().run(); currentColor = defaultColor }} class='material' disabled={currentColor === defaultColor} title='Reset barvy'>format_color_reset</button>
    <span class='sep'></span>
    <button type='button' onclick={setLink} class='material' title='Odkaz'>link</button>
    <button type='button' onclick={() => { editor.chain().focus().unsetLink().run(); isLink = false }} class='material' disabled={!isLink} title='Zrušit odkaz'>link_off</button>
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
