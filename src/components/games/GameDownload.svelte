<script>
  import { posts } from '@lib/stores'
  import Thread from '@components/common/Thread.svelte'

  export let user = {}
  export let data = {}

  $posts = data.posts
</script>

<h1>{data.name}</h1>

{#if data.owner.id === user.id}
  {#key posts}
    <Thread posts={posts} {user} id={data.game_thread} iconSize={100} />
  {/key}
{:else}
  Nemůžeš exportovat, nejsi vlastníkem hry
{/if}
