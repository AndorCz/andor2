<script>
  // Shows a long text that can be edited in place
  import { marked } from 'marked'
  import { Render } from '@jill64/svelte-sanitize'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let userId
  export let onSave
  export let value = ''
  export let loading = false
  export let canEdit = false
  export let allowHtml = false
  export let enterSend = false

  let isEditing = false
  let originalValue = value

  function onSaveWrapper () {
    isEditing = false
    onSave(value)
    originalValue = value
  }

  function handleKeyDown (event) {
    if (event.key === 'Escape' && isEditing) {
      if (value !== originalValue) {
        const confirmCancel = confirm('Máš neuložené změny. Opravdu zrušit?')
        if (confirmCancel) {
          isEditing = false
          value = originalValue
        }
      } else {
        isEditing = false
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class='wrapper'>
  {#if isEditing}
    <TextareaExpandable {loading} {userId} bind:value={value} bind:editing={isEditing} onSave={onSaveWrapper} {allowHtml} {enterSend} buttonIcon='done' showButton />
  {:else}
    <content class='editableLong'><Render html={marked(value || '')} /></content>
    {#if canEdit}
      <button on:click={() => { isEditing = true }} title='Upravit'><span class='material'>edit</span></button>
    {/if}
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
  }
    content {
      width: 100%;
      height: auto;
      min-height: 100px;
      display: block;
      padding: 20px;
      padding-right: 80px;
      font-size: 20px;
      line-height: 1.5;
      background-color: var(--block);
    }

    button {
      position: absolute;
      bottom: 0px;
      right: 0px;
      border-radius: 0px;
      padding: 10px 15px;
      border-radius: 10px 0px 10px 0px;
    }
  @media (max-width: 500px) {
    content {
      padding: 20px;
    }
  }
</style>
