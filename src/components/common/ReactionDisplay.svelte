<script>
  export let postStore
</script>

<span class='reactions'>
  {#if $postStore.frowns.length}<span class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'><span class='count'>{$postStore.frowns.length}</span></span>{/if}
  {#if $postStore.laughs.length}<span class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích'><span class='count'>{$postStore.laughs.length}</span></span>{/if}
  {#if $postStore.shocks.length}<span class='reaction shocks' title='Šok'><img src='/svg/shocks.svg' alt='Šok'><span class='count'>{$postStore.laughs.length}</span></span>{/if}
  {#if $postStore.hearts.length}<span class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'><span class='count'>{$postStore.hearts.length}</span></span>{/if}
  {#if $postStore.thumbs.length}<span class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'><span class='count'>{$postStore.thumbs.length}</span></span>{/if}
</span>

<style>
  .reactions {
    display: flex;
    margin-top: 20px;
    margin-left: -5px;
  }
    .reaction {
      position: relative;
      opacity: 0.7;
      display: flex;
      height: 40px;
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
</style>
