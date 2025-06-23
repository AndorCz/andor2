<script>
  import { supabase, handleError } from '@lib/database-browser'

  const { user, itemStore = {}, type = 'post' } = $props()

  function getMyReaction (reaction) {
    return $itemStore[reaction]?.findIndex((id) => { return id === user.id })
  }

  function hasReacted (reaction) {
    return getMyReaction(reaction) > -1
  }

  async function toggleReaction (reaction) {
    const { data, error } = await supabase.rpc('update_reaction', { i_id: $itemStore.id, i_type: type, reaction_type: reaction, action: hasReacted(reaction) ? 'remove' : 'add' }).single()
    if (error) { return handleError(error) }
    $itemStore.frowns = data.frowns
    $itemStore.thumbs = data.thumbs
    $itemStore.shocks = data.shocks
    $itemStore.hearts = data.hearts
    $itemStore.laughs = data.laughs
  }
</script>

{#key $itemStore}
  {#if user.id && $itemStore.owner !== user.id}
    <span class='reactions'>
      <button onclick={() => { toggleReaction('frowns') }} class:active={hasReacted('frowns')} class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek' class='icon'>{#if $itemStore.frowns?.length}<span class='count'>{$itemStore.frowns.length}</span>{/if}</button>
      <button onclick={() => { toggleReaction('laughs') }} class:active={hasReacted('laughs')} class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích' class='icon'>{#if $itemStore.laughs?.length}<span class='count'>{$itemStore.laughs.length}</span>{/if}</button>
      <button onclick={() => { toggleReaction('shocks') }} class:active={hasReacted('shocks')} class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok' class='icon'>{#if $itemStore.shocks?.length}<span class='count'>{$itemStore.shocks.length}</span>{/if}</button>
      <button onclick={() => { toggleReaction('hearts') }} class:active={hasReacted('hearts')} class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce' class='icon'>{#if $itemStore.hearts?.length}<span class='count'>{$itemStore.hearts.length}</span>{/if}</button>
      <button onclick={() => { toggleReaction('thumbs') }} class:active={hasReacted('thumbs')} class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru' class='icon'>{#if $itemStore.thumbs?.length}<span class='count'>{$itemStore.thumbs.length}</span>{/if}</button>
    </span>
  {:else}
    <span class='reactions'>
      {#if $itemStore.frowns?.length}<span class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek' class='icon'><span class='count'>{$itemStore.frowns?.length}</span></span>{/if}
      {#if $itemStore.laughs?.length}<span class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích' class='icon'><span class='count'>{$itemStore.laughs?.length}</span></span>{/if}
      {#if $itemStore.shocks?.length}<span class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok' class='icon'><span class='count'>{$itemStore.shocks?.length}</span></span>{/if}
      {#if $itemStore.hearts?.length}<span class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce' class='icon'><span class='count'>{$itemStore.hearts?.length}</span></span>{/if}
      {#if $itemStore.thumbs?.length}<span class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru' class='icon'><span class='count'>{$itemStore.thumbs?.length}</span></span>{/if}
    </span>
  {/if}
{/key}

<style>
  .reactions {
    display: flex;
    align-items: center;
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
