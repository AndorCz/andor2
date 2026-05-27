<script>
  let { value = 0, disabled = false, onChange = () => {} } = $props()

  let hovered = $state(0)
  const shownValue = $derived(hovered || value)

  function setHovered (score) {
    if (disabled) { return }
    hovered = score
  }

  function clearHovered () {
    hovered = 0
  }

  function selectScore (score) {
    if (disabled) { return }
    onChange(score)
  }
</script>

<div class='stars' onmouseleave={clearHovered}>
  {#each [1, 2, 3, 4, 5] as score (score)}
    <button
      class='material square {score <= shownValue ? "active" : ""}'
      title={`Ohodnotit ${score} hvězd`}
      onmouseenter={() => setHovered(score)}
      onfocus={() => setHovered(score)}
      onblur={clearHovered}
      onclick={() => selectScore(score)}
      disabled={disabled}
    >star</button>
  {/each}
</div>

<style>
  .stars {
    display: flex;
    gap: 6px;
  }
    .stars button {
      color: var(--dim);
    }
    .stars button.active {
      color: #f0b429;
    }
</style>
