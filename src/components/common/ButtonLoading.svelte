<script>
  import Loading from '@components/common/Loading.svelte'

  const { loading = false, disabled = false, handleClick, label } = $props()
</script>

<button type='button' onclick={handleClick} disabled={loading || disabled}>
  <span class:loading={loading}>{label}</span>
  {#if loading}
    <Loading />
  {/if}
</button>

<style>
  button {
    position: relative;
  }
    .loading {
      color: var(--block);
    }
</style>
