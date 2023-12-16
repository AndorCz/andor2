<script>
  export let value
  export let onSave
  export let disabled = false

  let textareaHeight
  let buttonIcon = 'send'

  function setHeight (node) {
    let textareaRef = node.target || node
    textareaRef.style.height = 'auto'
    textareaRef.style.height = `${textareaRef.scrollHeight}px`
  }
</script>

<div class='wrapper'>
  <textarea bind:value={value} use:setHeight on:input={setHeight}></textarea>
  <button on:click={onSave} {disabled}><span class='material-symbols-rounded'>{buttonIcon}</span></button>
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
      padding-right: 80px;
    }

    button {
      position: absolute;
      bottom: 0px;
      right: 0px;
      border-radius: 0px;
      padding: 15px 20px;
      border-radius: 10px 0px 10px 0px;
    }
</style>