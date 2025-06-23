<script>
  // Shows a long text that can be edited in place
  import Loading from '@components/common/Loading.svelte'
  import DOMPurify from 'dompurify'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import { tooltip } from '@lib/tooltip'

  let { user, onSave, value = $bindable(''), placeholder = '', loading = false, canEdit = false, allowHtml = false, enterSend = false, mentionList = null, fonts = null } = $props()

  let isEditing = $state(false)

  function onSaveWrapper () {
    isEditing = false
    onSave(value)
  }
</script>

<div class='wrapper'>
  {#if isEditing}
    <TextareaExpandable {fonts} {placeholder} {loading} {user} bind:value={value} bind:editing={isEditing} onSave={onSaveWrapper} {allowHtml} {enterSend} {mentionList} disableEmpty={false} cancelClearsValue={false} buttonIcon='done' showButton />
  {:else}
    {#if loading}
      <Loading />
    {/if}
    <main class='editableLong'>
      {@html DOMPurify.sanitize(value || placeholder)}
      <div class='clear'></div>
    </main>
    {#if canEdit && !loading}
      <button onclick={() => { isEditing = true }} title='Upravit' use:tooltip><span class='material'>edit</span></button>
    {/if}
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    text-align: left;
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
    .clear {
      clear: both;
    }
  @media (max-width: 500px) {
    main {
      padding: 20px;
    }
  }
</style>
