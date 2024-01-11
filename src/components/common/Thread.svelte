<script>
  import { isFilledArray } from '@lib/utils'
  import { Render } from 'svelte-purify'

  export let posts
  export let canDeleteAll
  export let myIdentities = []
  export let onDelete
  export let onEdit
  export let onPaging
  export let page = 0
  export let pages
  export let iconSize = 140

  let threadEl

  const isMyPost = (id, dice) => {
    if (dice) { return false } // don't allow deleting of dice posts, only to game owners
    return myIdentities.find((identity) => { return identity.id === id })
  }

  const triggerPaging = (newPage) => {
    page = newPage
    onPaging(page)
    threadEl.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<center bind:this={threadEl}>
  {#if isFilledArray(posts)}
    {#each posts as post}
      <div class='post'>
        {#if post.owner_portrait}
          <div class='icon' style='--iconSize: {iconSize}px'>
            <img src={post.owner_portrait} alt={post.owner_name} />
          </div>
        {/if}
        <div class='body'>
          <div class='header'>
            <span class='title'>
              <b>{post.owner_name}</b>
              {#if post.audience_names}
                <span class='audience'>jen pro: <b>{post.audience_names.join(', ')}</b></span>
              {/if}
            </span>
            <span class='time'>{new Date(post.created_at).toLocaleString('cs-CZ')}</span>
            {#if canDeleteAll || isMyPost(post.owner, post.dice)}
              <button on:click={() => onEdit(post.id, post.content)} class='material edit' title='Upravit'>edit</button>
              <button on:click={() => onDelete(post.id)} class='material delete' title='Smazat'>delete</button>
            {/if}
          </div>
          <div class='content'><Render html={post.content} /></div>
        </div>
      </div>
    {/each}
    <div class='pagination'>
      {#each { length: pages } as _, i}
        <button on:click={() => { triggerPaging(i) } } disabled={i === page}>{i + 1}</button>
      {/each}
    </div>
  {:else}
    Žádné další příspěvky
  {/if}
</center>

<style>

  center {
    margin-top: 50px;
  }
    .post {
      display: flex;
      width: 100%;
      margin-bottom: 20px;
      text-align: left;
      gap: 10px;
    }
      .icon {
        width: var(--iconSize);
      }
        .icon img {
          width: 100%;
          display: block;
          box-shadow: 2px 2px 3px #0002;
        }

    .body {
      flex: 1;
    }
      .content {
        background-color: var(--block);
        padding: 20px;
        box-shadow: 2px 2px 3px #0002;
      }
      .header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: color-mix(in srgb, var(--block), var(--panel) 50%);
        padding: 10px 15px;
        box-shadow: 2px 2px 3px #0002;
        color: var(--dim);
      }
        .title {
          flex: 1;
        }
        .audience {
          font-size: 15px;
          padding-left: 5px;
        }
        .time {
          opacity: 0.5;
        }
        .delete, .edit {
          margin-left: 10px;
          padding: 5px;
          font-size: 19px;
          cursor: pointer;
          opacity: 0.5;
        }
          .delete:hover, .edit:hover {
            opacity: 1;
          }
  .pagination {
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 22px;
      padding: 15px 25px;
    }
</style>
