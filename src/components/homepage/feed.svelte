<script>
  export let lastEditorial = null
</script>

<div id='editorial'>
  {#if lastEditorial}
    <div class='editorial'>
      <p>{@html lastEditorial.content}</p>
    </div>
  {/if}
</div>
