<script>
  import { supabase, handleError } from '@lib/database-browser'

  export let user
  export let itemStore
  export let type = 'post'

  function getMyReaction (reaction) {
    return $itemStore[reaction]?.findIndex((id) => { return id === user.id })
  }

  function hasReacted (reaction) {
    return getMyReaction(reaction) > -1
  }

  async function toggleReaction (reaction) {
    // update database
    const { data, error } = await supabase.rpc('update_reaction', { i_id: $itemStore.id, i_type: type, reaction_type: reaction, action: hasReacted(reaction) ? 'remove' : 'add' }).single()
    if (error) { return handleError(error) }
    $itemStore.frowns = data.frowns
    $itemStore.thumbs = data.thumbs
    $itemStore.shocks = data.shocks
    $itemStore.hearts = data.hearts
    $itemStore.laughs = data.laughs
  }
</script>

{#if user.id && $itemStore.owner !== user.id}
  {#key $itemStore}
    <span class='reactions'>
      <button on:click={() => { toggleReaction('frowns') }} class:active={hasReacted('frowns')} class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek'>{#if $itemStore.frowns?.length}<span class='count'>{$itemStore.frowns.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('laughs') }} class:active={hasReacted('laughs')} class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích'>{#if $itemStore.laughs?.length}<span class='count'>{$itemStore.laughs.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('shocks') }} class:active={hasReacted('shocks')} class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok'>{#if $itemStore.shocks?.length}<span class='count'>{$itemStore.shocks.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('hearts') }} class:active={hasReacted('hearts')} class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce'>{#if $itemStore.hearts?.length}<span class='count'>{$itemStore.hearts.length}</span>{/if}</button>
      <button on:click={() => { toggleReaction('thumbs') }} class:active={hasReacted('thumbs')} class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru'>{#if $itemStore.thumbs?.length}<span class='count'>{$itemStore.thumbs.length}</span>{/if}</button>
    </span>
  {/key}
{/if}

<style>
  .reactions {
    display: flex;
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
      max-width: initial;
    }
      .reaction .count {
        padding-left: 5px;
        font-size: 22px;
        font-weight: bold;
      }
</style>
