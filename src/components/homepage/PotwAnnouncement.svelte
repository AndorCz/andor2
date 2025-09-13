<script>
  import DOMPurify from 'dompurify'
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { getSavedStore } from '@lib/stores'

  const { winner = null, weekId } = $props()

  let show = $state(false)
  let userStore

  onMount(() => {
    userStore = getSavedStore('user')
    if ($userStore.lastClosedPotw !== weekId) {
      show = true
    }
  })

  function close () {
    show = false
    $userStore.lastClosedPotw = weekId
  }
</script>

{#if winner && show}
  <div id='potw' transition:slide={{ duration: 300 }}>
    <h4>Příspěvek týdne</h4>
    <section>{@html DOMPurify.sanitize(winner.content)}</section>
    <p><a href='/post-of-the-week'>Hlasovat o příspěvek týdne</a></p>
    <button onclick={close} class='close' title='Skrýt'>
      <span class='material'>check</span>
    </button>
  </div>
{/if}

<style>
  #potw {
    padding: 20px;
    padding-bottom: 10px;
    margin-bottom: 20px;
    background-color: var(--prominent);
    position: relative;
    overflow: hidden;
  }
  #potw h4 {
    margin-top: 0px;
    margin-bottom: 0px;
    font-size: 18px;
  }
  #potw section {
    margin-top: 10px;
  }
  #potw button {
    position: absolute;
    top: 0px;
    right: 0px;
    border-radius: 0px 0px 0px 10px;
    padding: 8px 10px 5px 11px;
  }
</style>
