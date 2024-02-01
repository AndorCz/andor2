<script>
  import Loading from '@components/common/Loading.svelte'

  export let loading = false
  export let disabled = false
  export let handleClick
  export let label
</script>

<button type='button' on:click={handleClick} disabled={loading || disabled}>
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
