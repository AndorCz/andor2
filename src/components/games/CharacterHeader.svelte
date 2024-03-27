<script>
  export let isStoryteller = false
</script>

{#if isStoryteller}
  <tr>
    <th class='portrait'></th>
    <th class='name'>Jméno</th>
    <th class='player'>Hráč</th>
    <th class='tools'></th>
  </tr>
{/if}

<style>
  th {
    font-weight: normal;
    color: var(--dim);
    padding-left: 15px;
    text-align: left;
    font-size: 16px;
    padding-bottom: 10px;
  }
</style>
