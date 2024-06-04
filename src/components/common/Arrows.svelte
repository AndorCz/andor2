<script>
  import { onMount } from 'svelte'

  let scrollable, content

  onMount(() => {
    scrollable = document.getElementById('scrollable')
    content = document.getElementById('content')
  })

  function scrollUp () { scrollable.scrollTo(0, 0) }
  function scrollDown () { scrollable.scrollTo(0, content.scrollHeight) }
</script>

<main>
  <button class='up material' on:click={scrollUp}>arrow_drop_up</button>
  <div class='spacer'></div>
  <button class='down material' on:click={scrollDown}>arrow_drop_down</button>
</main>

<style>
  main {
    position: absolute;
    top: 0;
    right: 0px;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .spacer {
    flex-grow: 1;
  }
  button {
    float: right;
    position: sticky;
    right: 0px;
    z-index: 9;
    width: 30px;
    height: 30px;
    padding: 7px;
    font-size: 20px;
  }
  .up {
    top: 0px;
    border-radius: 0 0 0 100%;
    line-height: 0;
  }
  .down {
    bottom: 0px;
    border-radius: 100% 0 0 0;
  }
</style>
