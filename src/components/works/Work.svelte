<script>
  import Discussion from '@components/Discussion.svelte'

  export let user = {}
  export let data = {}
</script>

<main>
  <a href='javascript:history.back()'>zpět</a>
  <h1>{data.name}</h1>
  <div class='work'>{@html data.content}</div>
  <Discussion {data} {user} thread={data.thread} isOwner={data.author.id === user.id} unread={data.unread} />
</main>

<style>
  .work {
    margin-bottom: 50px;
  }
</style>
