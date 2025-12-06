<script>
  const { user, iframeSrc } = $props()
</script>

{#if user.id}
  <div class='tirien-iframe-container'>
    <iframe src={iframeSrc} width='100%' height='100%' frameborder='0' allow='autoplay; encrypted-media; fullscreen'></iframe>
  </div>
{:else}
  <center>Tato sekce je jen pro přihlášené uživatele</center>
{/if}

<style>
  .tirien-iframe-container {
    width: 100%;
    height: 100%;
    overlay: hidden;
  }
</style>
