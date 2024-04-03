<script>
  import { onMount } from 'svelte'

  export let as = 'Jako'
  export let to = 'Komu'
  export let myCharacters
  export let otherCharacters
  export let activeAudienceIds
  export let onAudienceSelect
  export let gameStore

  let identitySelect
  let audienceSelect

  onMount(() => { // set select value on mount
    if (identitySelect) { // might not exist if no character
      $gameStore.activeCharacterId ? identitySelect.value = $gameStore.activeCharacterId : identitySelect.selectedIndex = 0
    }
    if (audienceSelect) { audienceSelect.selectedIndex = 0 } // select first audience (everyone)
  })
</script>

<div class='headlineWrapper'>
  <h3>{as}</h3>
  <h3>{to}</h3>
</div>
<div class='selectWrapper'>
  <select size='4' bind:this={identitySelect} bind:value={$gameStore.activeCharacterId}>
    {#each myCharacters as character}
      <option value={character.id} class='character'>{character.name}</option>
    {/each}
  </select>
  <select size='4' bind:this={audienceSelect} bind:value={$activeAudienceIds} on:change={onAudienceSelect} multiple>
    {#each otherCharacters as character}
      <option value={character.id} class='character'>{character.name}</option>
    {/each}
  </select>
</div>

<style>
  .headlineWrapper, .selectWrapper {
    display: flex;
    gap: 40px;
  }
    .headlineWrapper h3 {
      flex: 1;
    }
    .selectWrapper select {
      background: none;
      flex: 1;
    }
  h3 {
    margin: 15px 0px;
  }
  @media (max-width: 860px) {
    .headlineWrapper, .selectWrapper {
      gap: 10px;
    }
  }
</style>
