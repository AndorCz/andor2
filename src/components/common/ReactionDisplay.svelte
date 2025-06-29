<script>
  import ReactionInput from '@components/common/ReactionInput.svelte'
  import { tooltipContent } from '@lib/tooltip'

  const { post = {}, user = {}, type } = $props()

  let toolbarRef = $state()
</script>

<div class='toolbar' bind:this={toolbarRef}>
  <ReactionInput {user} {post} {type} />
</div>
<span class='reactions' use:tooltipContent={{ content: toolbarRef, trigger: 'click' }}>
  {#if post.frowns?.length}<span class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'><span class='count'>{post.frowns.length}</span></span>{/if}
  {#if post.laughs?.length}<span class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích'><span class='count'>{post.laughs.length}</span></span>{/if}
  {#if post.shocks?.length}<span class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok'><span class='count'>{post.shocks.length}</span></span>{/if}
  {#if post.hearts?.length}<span class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'><span class='count'>{post.hearts.length}</span></span>{/if}
  {#if post.thumbs?.length}<span class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'><span class='count'>{post.thumbs.length}</span></span>{/if}
</span>

<style>
  .reactions {
    cursor: pointer;
    display: flex;
    align-items: center;
  }
    .reaction {
      position: relative;
      opacity: 0.7;
      display: flex;
      height: 40px;
      min-width: 40px;
      padding: 0px 7px;
      justify-content: center;
      align-items: center;
    }
    .reaction img {
      width: 20px;
      fill: var(--dim);
    }
      .reaction .count {
        padding-left: 5px;
        font-size: 22px;
        font-weight: bold;
      }
  .toolbar {
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
</style>
