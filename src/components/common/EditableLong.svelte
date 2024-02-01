<script>
  // Shows a long text that can be edited in place
  import { marked } from 'marked'
  import Loading from '@components/common/Loading.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let value = ''
  export let onSave
  export let loading = false
  export let canEdit = false

  let isEditing = false
  let originalValue = value

  function onSaveWrapper () {
    isEditing = false
    onSave()
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
  {#if loading}
    <Loading />
  {/if}
  {#if isEditing}
    <TextareaExpandable bind:value={value} onSave={onSaveWrapper} buttonIcon='done' showButton />
  {:else}
    <content class='editableLong'>{@html marked(value || '')}</content>
    {#if canEdit}
      <button on:click={() => { isEditing = true }}><span class='material'>edit</span></button>
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
      padding: 15px 20px;
      border-radius: 10px 0px 10px 0px;
    }

  @media (max-width: 860px) {
    button {
      padding: 10px 15px;
    }
  }
</style>
