<script>
  export let value
  export let onSave
  export let name = 'textarea'
  export let disabled = false
  export let editing = false
  export let showButton = false
  export let buttonIcon = 'send'

  const minHeight = 140

  function setHeight (node) {
    const textareaRef = node.target || node
    textareaRef.style.height = 'auto'
    textareaRef.style.height = `${textareaRef.scrollHeight > minHeight ? textareaRef.scrollHeight : minHeight}px`
  }

  function cancelEdit () {
    editing = false
    value = ''
  }
</script>

<div class='wrapper'>
  <textarea bind:value={value} {name} use:setHeight on:input={setHeight} class={showButton && 'withButton'}></textarea>
  {#if showButton}
    <button on:click={onSave} {disabled} class='save'>
      <span class='material-symbols'>{#if editing}edit{:else}{buttonIcon}{/if}</span>
    </button>
  {/if}
  {#if editing}
    <button on:click={cancelEdit} class='cancel'>
      <span class='material-symbols'>close</span>
    </button>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    width: 100%;
  }
    textarea {
      width: 100%;
      min-height: 100%;
      display: block;
    }
      .withButton {
        padding-right: 80px;
      }

    button {
      position: absolute;
      right: 0px;
      padding: 15px 20px;
    }
      .save {
        bottom: 0px;
        border-radius: 10px 0px 10px 0px;
      }
      .cancel {
        top: 0px;
        border-radius: 0px 10px 0px 10px;
      }
</style>
