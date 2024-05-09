<script>
  // Shows a long text that can be edited in place
  import { tooltip } from '@lib/tooltip'
  import { Render } from '@jill64/svelte-sanitize'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let userId
  export let onSave
  export let value = ''
  export let placeholder = ''
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
    <TextareaExpandable {placeholder} {loading} {userId} bind:value={value} bind:editing={isEditing} onSave={onSaveWrapper} {allowHtml} {enterSend} disableEmpty={false} buttonIcon='done' showButton />
  {:else}
    <main class='editableLong'><Render html={value || placeholder} /></main>
    {#if canEdit}
      <button on:click={() => { isEditing = true }} title='Upravit' use:tooltip><span class='material'>edit</span></button>
    {/if}
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
  }
    main {
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
    main {
      padding: 20px;
    }
  }
</style>
