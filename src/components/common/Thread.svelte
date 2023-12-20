<script>
  export let posts
  export let canDeleteAll
  export let myIdentities

  const isMyPost = (id) => {
    return myIdentities.find((identity) => { return identity.id === id })
  }

  function deletePost () {
    if (!window.confirm('Opravdu smazat příspěvek?')) { return }
  }
</script>

<center>
  {#each posts as post}
    <div class='post'>
      {#if post.owner_portrait}
        <div class='icon'>
          <img src={post.owner_portrait} alt={post.owner_name} />
        </div>
      {/if}
      <div class='body'>
        <div class='header'>
          <span class='name'>{post.owner_name}</span>
          <span class='time'>{new Date(post.created_at).toLocaleString('cs-CZ')}</span>
          {#if canDeleteAll || isMyPost(post.owner)}
            <button on:click={deletePost} class='material-symbols-rounded delete' title='smazat příspěvek'>delete</button>
          {/if}
        </div>
        <div class='content'>
          {post.content}
        </div>
      </div>
    </div>
  {:else}
    Žádné příspěvky
  {/each}
</center>

<style>

  center {
    margin-top: 100px;
  }
    .post {
      display: flex;
      width: 100%;
      margin-bottom: 20px;
      text-align: left;
      gap: 10px;
    }
      .icon {
        width: 140px;
      }
        .icon img {
          width: 100%;
          display: block;
        }
    
    .body {
      flex: 1;
    }
    .content {
        background-color: var(--block);
        padding: 20px;
      }
      .header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--block);
        opacity: 0.5;
        padding: 10px 15px;
        box-shadow: 2px 2px 3px #0002;
      }
        .name {
          font-weight: bold;
          flex: 1;
        }
        .time {
          color: var(--dim);
        }
        .delete {
          margin-left: 10px;
          padding: 5px;
          font-size: 14pt;
          cursor: pointer;
        }

</style>
