<script>
  import Discussion from '@components/Discussion.svelte'

  export let user = {}
  export let data = {}
</script>

<main>
  <a href='javascript:history.back()'>zpět</a>
  <h1>{data.name}</h1>
  <div class='article'>{@html data.content}</div>
  <Discussion {data} {user} thread={data.thread} isOwner={data.author.id === user.id} unread={data.unread} />
</main>

<style>
  .article {
    margin-bottom: 50px;
  }
</style>
