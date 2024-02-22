<script>
  import Post from '@components/common/Post.svelte'

  export let lastPosts = []
  export let user = {}

  function groupPostsByContentId (posts) {
    return posts.reduce((groups, post) => {
      (groups[post.content_id] = groups[post.content_id] || []).push(post)
      return groups
    }, {})
  }

  const groupedPosts = groupPostsByContentId(lastPosts)
</script>

<h3>Poslední příspěvky</h3>
<div id='lastPosts'>
  {#each Object.entries(groupedPosts) as [contentId, posts]}
    {#if posts.length > 0}
      <a href={`/${posts[0].content_type}/${contentId}`}><h4>{posts[0].content_name}</h4></a>
      {#each posts as post}
        <Post {post} {user} iconSize={80} />
      {/each}
    {/if}
  {/each}
</div>

<style>
  h3 {
    margin-bottom: 10px;
  }
  #lastPosts h4 {
    display: inline-block;
    margin: 10px 0px;
  }
</style>
