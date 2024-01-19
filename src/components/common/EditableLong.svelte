<script>
  import { marked } from 'marked'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let value
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
    <div id='dots'></div>
  {/if}
  {#if isEditing}
    <TextareaExpandable bind:value={value} onSave={onSaveWrapper} buttonIcon='done' showButton />
  {:else}
    <content class='editableLong'>{@html marked(value)}</content>
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

    #dots {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90px;
      height: 14px;
      background:
        radial-gradient(circle closest-side, var(--accent) 92%,#0000 ) calc(100%/-4) 0,
        radial-gradient(circle closest-side, var(--accent) 92%,#0000 ) calc(100%/4)  0;
      background-size: calc(100%/2) 100%;
      animation: rotation 1.5s infinite;
    }
    @keyframes rotation {
      0%   {background-position: calc(100%/-4) 0    ,calc(100%/4) 0}
      50%  {background-position: calc(100%/-4) -14px,calc(100%/4) 14px}
      100% {background-position: calc(100%/4)  -14px,calc(3*100%/4) 14px}
    }

  @media (max-width: 860px) {
    button {
      padding: 10px 15px;
    }
  }
</style>
