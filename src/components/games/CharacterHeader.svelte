<script>
  export let isGameOwner = false
</script>

<tr>
  <th class='portrait'></th>
  <th class='name'>Jméno</th>
  <th class='player'>Hráč</th>
  {#if isGameOwner}
    <th class='tools'></th>
  {/if}
</tr>

<style>
  th {
    font-weight: normal;
    color: var(--dim);
    padding-left: 15px;
    text-align: left;
    font-size: 12pt;
    padding-bottom: 10px;
  }
</style>