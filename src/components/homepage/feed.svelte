<script>
  // import Post from '@components/common/Post.svelte'

  export let lastEditorial = null
  export let lastPosts = []
  export let user = {}
</script>

<!--<h3>Zeď</h3>-->

{#if lastEditorial}
  <div id='editorial'>
    <h4>Editorial</h4>
    <a href={'/work/' + lastEditorial.id}><h2>{lastEditorial.name}</h2></a>
    <content>{@html lastEditorial.content}</content>
  </div>
{/if}

<h3>Co se kde děje</h3>
<!--
<div id='lastPosts'>
  {#each lastPosts as post}
    <a href={`/${post.content_type}/${post.content.content_id}`}><h4>{post.content_name}</h4></a>
    <Post {post} {user} iconSize={50} />
  {/each}
</div>
-->

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
      display: inline-block;
    }
    #editorial content {
      font-size: 18px;
    }

    h3 {
      margin-bottom: 10px;
    }
    #lastPosts h4 {
      display: inline-block;
      margin: 10px 0px;
    }
</style>
