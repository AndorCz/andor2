<script>
  const { id, icon, label, active = false, unread = false, clearing = false, onactivate, onclear } = $props()
</script>

<div class='tab'>
  <button {id} class:active onclick={onactivate}><span class='material'>{icon}</span><span class='label'>{label}</span></button>
  {#if unread && !active}<button class='badge' title='Dvojklikem označit vše jako přečtené' aria-label={`${label}: dvojklikem označit vše jako přečtené`} disabled={clearing} ondblclick={onclear}></button>{/if}
</div>

<style>
  .tab { position: relative; flex: 1; }
  button { position: relative; width: 100%; display: flex; gap: 10px; color: var(--linkVisited); flex-direction: column; align-items: center; text-align: center; padding: 15px 0; background: none; border: 0; margin-bottom: -10px; border-radius: 10px 10px 0 0; box-shadow: none; }
  button:hover { color: var(--text); }
  button.active { background: var(--panel); color: var(--text); pointer-events: none; }
  .label { font-size: 14px; font-weight: 500; }
  button.badge { position: absolute; top: 10px; right: 10px; width: 10px; height: 10px; padding: 0; margin: 0; border-radius: 50%; background: var(--new); box-shadow: 2px 2px 4px #0006; }
  .badge::before { content: ''; position: absolute; inset: -7px; border-radius: 50%; }
  .badge:hover { box-shadow: 0 0 0 3px var(--panel), 0 0 0 5px var(--new); }
  .badge:focus-visible { outline: 2px solid var(--text); outline-offset: 4px; }
  .badge:disabled { cursor: wait; opacity: 0.6; }
</style>
