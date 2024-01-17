<script>
  import { isFilledArray } from '@lib/utils'
  import { Render } from 'svelte-purify'
  import { tooltip } from '@lib/tooltip'
  import { user } from '@lib/stores'

  export let posts
  export let canDeleteAll
  export let canModerate
  export let myIdentities = []
  export let allowReactions
  export let onDelete
  export let onEdit
  export let onModerate
  export let onPaging
  export let page = 0
  export let pages
  export let iconSize = 140

  let threadEl
  const moderatedVisibility = {}

  const isMyPost = (id, dice) => {
    if (dice) { return false } // don't allow deleting of dice posts, only to game owners
    return myIdentities.find((identity) => { return identity.id === id })
  }

  const triggerPaging = (newPage) => {
    page = newPage
    onPaging(page)
    threadEl.scrollIntoView({ behavior: 'smooth' })
  }

  const onHeaderClick = (post) => {
    if (post.moderated) {
      moderatedVisibility[post.id] = !moderatedVisibility[post.id]
    }
  }

  $: posts.forEach(post => {
    if (post.moderated) {
      if (!(post.id in moderatedVisibility)) { moderatedVisibility[post.id] = false }
    }
  })
</script>

<center bind:this={threadEl}>
  {#if isFilledArray(posts)}
    {#each posts as post}
      <div class='post' class:moderated={post.moderated} class:hidden={post.moderated && !moderatedVisibility[post.id]}>
        {#if post.owner_portrait}
          <div class='icon' style='--iconSize: {iconSize}px'>
            <img src={post.owner_portrait} alt={post.owner_name} />
          </div>
        {/if}
        <div class='body'>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class='header' on:click={() => { onHeaderClick(post) }}>
            <span class='title'>
              <b>{post.owner_name}</b>
              {#if post.audience_names}
                <span class='audience'>jen pro: <b>{post.audience_names.join(', ')}</b></span>
              {/if}
            </span>
            <span class='toolbar'>
              <span class='material time' use:tooltip title={new Date(post.created_at).toLocaleString('cs-CZ')}>schedule</span>
              {#if canDeleteAll || isMyPost(post.owner, post.dice)}
                <button on:click={() => onEdit(post.id, post.content)} class='material edit' title='Upravit'>edit</button>
                <button on:click={() => onDelete(post.id)} class='material delete' title='Smazat'>delete</button>
              {:else if canModerate}
                <button on:click={() => onModerate(post.id)} class='material moderate' title='Skrýt všem'>visibility_off</button>
              {/if}
            </span>
            {#if allowReactions}
              {#if $user.id}
                <span class='reactions'>
                  <button class='reaction heart' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'>{#if post.hearts.length}<span class='count'>{post.hearts.length}</span>{/if}</button>
                  <button class='reaction frown' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'>{#if post.hearts.length}<span class='count'>{post.frowns.length}</span>{/if}</button>
                  <button class='reaction laugh' title='Smích'><img src='/svg/laugh.svg' alt='Smích'>{#if post.hearts.length}<span class='count'>{post.laughs.length}</span>{/if}</button>
                  <button class='reaction thumb' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'>{#if post.hearts.length}<span class='count'>{post.thumbs.length}</span>{/if}</button>
                </span>
              {:else}
                <span class='reactions'>
                  {#if post.hearts.length}<span class='reaction heart' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'><span class='count'>{post.hearts.length}</span></span>{/if}
                  {#if post.frowns.length}<span class='reaction frown' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'><span class='count'>{post.frowns.length}</span></span>{/if}
                  {#if post.laughs.length}<span class='reaction laugh' title='Smích'><img src='/svg/laugh.svg' alt='Smích'><span class='count'>{post.laughs.length}</span></span>{/if}
                  {#if post.thumbs.length}<span class='reaction thumb' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'><span class='count'>{post.thumbs.length}</span></span>{/if}
                </span>
              {/if}
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
    Žádné příspěvky
  {/if}
</center>

<style>

  center {
    margin-top: 50px;
  }
    .post {
      display: flex;
      width: 100%;
      padding-top: 10px;
      padding-bottom: 10px;
      text-align: left;
      gap: 10px;
    }
      .moderated {
        opacity: 0.5;
        padding-top: 0px;
        padding-bottom: 0px;
      }
        .moderated .header {
          cursor: pointer;
        }
        .hidden .header {
          box-shadow: none;
          background-color: transparent;
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
        .hidden .content, .hidden .toolbar, .hidden .icon, .hidden .reactions, .hidden .time {
          display: none;
        }
      .header {
        width: 100%;
        min-height: 50px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: color-mix(in srgb, var(--block), var(--panel) 50%);
        padding: 5px 15px;
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
        .toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-right: 20px;
        }
          .time {
            opacity: 0.5;
          }
          .delete, .edit, .moderate {
            padding: 5px;
            font-size: 19px;
            cursor: pointer;
            opacity: 0.5;
          }
            .delete:hover, .edit:hover, .moderate:hover {
              opacity: 1;
            }

        /* Reactions */
        .reactions {
          display: flex;
          gap: 5px;
          margin-right: -5px;
        }
          .reaction {
            position: relative;
            opacity: 0.5;
            display: flex;
            height: 40px;
            padding: 0px 10px;
            justify-content: center;
            align-items: center;
          }
            button.reaction:hover {
              opacity: 1;
            }
          .reaction img {
            width: 24px;
          }
            .reaction .count {
              padding-left: 5px;
              font-size: 22px;
              font-weight: bold;
            }

  .pagination {
    margin-top: 70px;
  }
    .pagination button {
      margin: 5px;
      font-size: 22px;
      padding: 15px 25px;
    }

  @media (max-width: 719px) {
    .post {
      gap: 0px;
    }
  }
</style>
