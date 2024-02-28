<script>
  import Post from '@components/common/Post.svelte'

  export let lastPosts = []
  export let user = {}

  const grouped = lastPosts.reduce((acc, item) => {
    let group = acc.find(g => g.content_id === item.content_id)
    if (!group) {
      group = { contentId: item.content_id, contentType: item.content_type, contentName: item.content_name, latest: item.created_at, posts: [] }
      acc.push(group)
    }
    group.posts.push(item)
    if (new Date(item.created_at) > new Date(group.latest)) {
      group.latest = item.created_at
    }
    return acc
  }, [])

  const sortedGroups = grouped.sort((a, b) => new Date(b.latest) - new Date(a.latest)).map(({ contentId, contentType, contentName, posts }) => ({ contentId, contentType, contentName, posts }))
</script>

<h3>Poslední příspěvky</h3>
<div id='lastPosts'>
  {#each sortedGroups as group}
    {#if group.posts.length > 0}
      <a href={`/${group.contentType}/${group.contentId}`}><h4>{group.contentName}</h4></a>
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
