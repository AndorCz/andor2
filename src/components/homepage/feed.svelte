<script>
  import Post from '@components/common/Post.svelte'
  import { Render } from '@jill64/svelte-sanitize'

  export let lastEditorial = null
  export let lastPosts = []
  export let user = {}

  function groupPostsByContentId(posts) {
    return posts.reduce((groups, post) => {
      (groups[post.content_id] = groups[post.content_id] || []).push(post)
      return groups
    }, {})
  }

  const groupedPosts = groupPostsByContentId(lastPosts)
</script>

<!--<h3>Zeď</h3>-->

{#if lastEditorial}
  <div id='editorial'>
    <h4>Editorial</h4>
    <a href={'/work/' + lastEditorial.id}><h2>{lastEditorial.name}</h2></a>
    <content><Render html={lastEditorial.content} /></content>
  </div>
{/if}

<h3>Co se kde děje</h3>
<div id='lastPosts'>
  {#each Object.entries(groupedPosts) as [contentId, posts]}
    {#if posts.length > 0}
      <a href={`/${posts[0].content_type}/${contentId}`}><h4>{posts[0].content_name}</h4></a>
      {#each posts as post}
        <Post {post} {user} iconSize={50} />
      {/each}
    {/if}
  {/each}
</div>

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
