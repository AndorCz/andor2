<script>
  import Post from '@components/common/Post.svelte'

  export let lastPosts = []
  export let user = {}

  const grouped = lastPosts.reduce((acc, item) => {
    let group = acc.find(g => g.content_id === item.content_id)
    if (!group) {
      group = { content_id: item.content_id, content_type: item.content_type, content_name: item.content_name, latest: item.created_at, posts: [] };
      acc.push(group)
    }
    group.posts.push(item)
    if (new Date(item.created_at) > new Date(group.latest)) {
      group.latest = item.created_at
    }
    return acc
  }, [])

  const sortedGroups = grouped.sort((a, b) => new Date(b.latest) - new Date(a.latest)).map(({ content_id, content_type, content_name, posts }) => ({ content_id, content_type, content_name, posts }))

  console.log(sortedGroups)
</script>

<h3>Poslední příspěvky</h3>
<div id='lastPosts'>
  {#each sortedGroups as group}
    {#if group.posts.length > 0}
      <a href={`/${group.content_type}/${group.content_id}`}><h4>{group.content_name}</h4></a>
      {#each group.posts as post}
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
