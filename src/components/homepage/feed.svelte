<script>
  export let lastEditorial = null
</script>

<!--<h3>Zeď</h3>-->

{#if lastEditorial}
  <div id='editorial'>
    <a href='/works'><h4>Editorial</h4></a>
    <h2>{lastEditorial.name}</h2>
    <content>{@html lastEditorial.content}</content>
  </div>
{/if}

<style>
  #editorial {
    padding: 20px;
    text-align: justify;
    text-justify: inter-word;
    hyphens: auto;
    background-color: var(--prominent);
  }
    #editorial h4 {
      margin-top: 0px;
      margin-bottom: 0px;
      font-size: 18px;
    }
    #editorial h2 {
      margin-top: 0px;
      margin-bottom: 10px;
    }
    #editorial content {
      font-size: 18px;
    }
</style>
