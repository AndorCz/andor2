<script>
  import { supabase, handleError } from '@lib/database-browser'

  export let user
  export let postStore = {}

  function getMyReaction (reaction) {
    return $postStore[reaction]?.findIndex((id) => { return id === user.id })
  }

  function hasReacted (reaction) {
    return getMyReaction(reaction) > -1
  }

  async function toggleReaction (reaction) {
    // update database
    const { data, error } = await supabase.rpc('update_reaction', { post: $postStore.id, reaction_type: reaction, action: hasReacted(reaction) ? 'remove' : 'add' }).single()
    if (error) { return handleError(error) }
    $postStore.frowns = data.frowns
    $postStore.thumbs = data.thumbs
    $postStore.shocks = data.shocks
    $postStore.hearts = data.hearts
    $postStore.laughs = data.laughs
  }
</script>

{#key $postStore}
  {#if user.id && $postStore.owner !== user.id}
    <span class='reactions'>
      <button on:click={() => { toggleReaction('frowns') }} class:active={hasReacted('frowns')} class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek' class='icon'>{#if $postStore.frowns?.length}<span class='count'>{$postStore.frowns.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('laughs') }} class:active={hasReacted('laughs')} class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích' class='icon'>{#if $postStore.laughs?.length}<span class='count'>{$postStore.laughs.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('shocks') }} class:active={hasReacted('shocks')} class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok' class='icon'>{#if $postStore.shocks?.length}<span class='count'>{$postStore.shocks.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('hearts') }} class:active={hasReacted('hearts')} class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce' class='icon'>{#if $postStore.hearts?.length}<span class='count'>{$postStore.hearts.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('thumbs') }} class:active={hasReacted('thumbs')} class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru' class='icon'>{#if $postStore.thumbs?.length}<span class='count'>{$postStore.thumbs.length}</span>{/if}</button>
    </span>
  {:else}
    <span class='reactions'>
      {#if $postStore.frowns?.length}<span class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek' class='icon'><span class='count'>{$postStore.frowns?.length}</span></span>{/if}
      {#if $postStore.laughs?.length}<span class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích' class='icon'><span class='count'>{$postStore.laughs?.length}</span></span>{/if}
      {#if $postStore.shocks?.length}<span class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok' class='icon'><span class='count'>{$postStore.shocks?.length}</span></span>{/if}
      {#if $postStore.hearts?.length}<span class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce' class='icon'><span class='count'>{$postStore.hearts?.length}</span></span>{/if}
      {#if $postStore.thumbs?.length}<span class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru' class='icon'><span class='count'>{$postStore.thumbs?.length}</span></span>{/if}
    </span>
  {/if}
{/key}

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
      button.reaction {
        background: none;
        border: none;
        box-shadow: none;
        color: var(--dim);
      }
      button.reaction.active {
        background-color: var(--panel);
        border: 1px var(--panel) solid;
        box-shadow: inset 2px 2px 2px #0003;
        opacity: 1;
      }
      button.reaction:hover {
        opacity: 1;
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
  @media (max-width: 500px) {
    .reactions {
      width: 100%;
      margin: 0px;
    }
  }
</style>
