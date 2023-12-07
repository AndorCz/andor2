<script>
  export let value
  export let onSave
  export let canEdit = false

  let isEditing = false
</script>

<div class='wrapper'>
  {#if isEditing}
    <textarea bind:value={value}></textarea>
    <button on:click={() => { onSave(); isEditing = false }}><span class='material-symbols-rounded'>done</span></button>
  {:else}
    <p>{value}</p>
    {#if canEdit}
      <button on:click={() => { isEditing = true }}><span class='material-symbols-rounded'>edit</span></button>
    {/if}
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
  }
    p, textarea {
      width: 100%;
      min-height: 100px;
      display: block;
      padding-right: 80px;
    }
    p {
      font-style: italic;
      padding: 20px;
      padding-right: 80px;
      background-color: var(--block);
    }
    button {
      position: absolute;
      bottom: 0px;
      right: 0px;
      border-radius: 0px;
      padding: 15px 20px;
    }
</style>