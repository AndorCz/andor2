<script>
  import Post from '@components/common/Post.svelte'

  export let lastPosts = []
  export let user = {}

  const groups = []

  lastPosts.forEach(post => {
    const group = groups.find(group => group.headline.contentId === post.content_id)
    if (group) {
      group.posts.push(post)
    } else {
      groups.push({
        headline: {
          contentId: post.content_id,
          contentName: post.content_name,
          contentType: post.content_type
        },
        posts: [post]
      })
    }
  })
</script>

<h3>Poslední příspěvky</h3>
<div id='lastPosts'>
  {#if groups}
    {#each groups as group}
      <a href={`/${group.headline.contentType}/${group.headline.contentId}`}><h4>{group.headline.contentName}</h4></a>
      {#each group.posts as post}
        <Post {post} {user} iconSize={80} allowReactions={post.owner_type === 'user'} />
      {/each}
    {/each}
  {/if}
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
