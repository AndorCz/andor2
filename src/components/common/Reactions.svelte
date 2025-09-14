<script>
  import { supabase, handleError } from '@lib/database-browser'

  const { user = {}, post = {}, type = 'post', allowed = ['frowns', 'laughs', 'shocks', 'hearts', 'thumbs'] } = $props()

  function getMyReaction (reaction) {
    return post[reaction]?.findIndex((id) => { return id === user.id })
  }

  function hasReacted (reaction) {
    return getMyReaction(reaction) > -1
  }

  async function toggleReaction (reaction) {
    const { data, error } = await supabase.rpc('update_reaction', { i_id: post.id, i_type: type, reaction_type: reaction, action: hasReacted(reaction) ? 'remove' : 'add' }).single()
    if (error) { return handleError(error) }
    post.frowns = data.frowns
    post.thumbs = data.thumbs
    post.shocks = data.shocks
    post.hearts = data.hearts
    post.laughs = data.laughs
  }
</script>

{#if user.id && post.owner !== user.id}
  <span class='reactions'>
    {#if allowed.includes('frowns')}
      <button onclick={() => { toggleReaction('frowns') }} class:active={hasReacted('frowns')} class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek' class='svg'>{#if post.frowns?.length}<span class='count'>{post.frowns.length}</span>{/if}</button>
    {/if}
    {#if allowed.includes('laughs')}
      <button onclick={() => { toggleReaction('laughs') }} class:active={hasReacted('laughs')} class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích' class='svg'>{#if post.laughs?.length}<span class='count'>{post.laughs.length}</span>{/if}</button>
    {/if}
    {#if allowed.includes('shocks')}
      <button onclick={() => { toggleReaction('shocks') }} class:active={hasReacted('shocks')} class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok' class='svg'>{#if post.shocks?.length}<span class='count'>{post.shocks.length}</span>{/if}</button>
    {/if}
    {#if allowed.includes('hearts')}
      <button onclick={() => { toggleReaction('hearts') }} class:active={hasReacted('hearts')} class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce' class='svg'>{#if post.hearts?.length}<span class='count'>{post.hearts.length}</span>{/if}</button>
    {/if}
    {#if allowed.includes('thumbs')}
      <button onclick={() => { toggleReaction('thumbs') }} class:active={hasReacted('thumbs')} class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru' class='svg'>{#if post.thumbs?.length}<span class='count'>{post.thumbs.length}</span>{/if}</button>
    {/if}
  </span>
{:else}
  <span class='reactions'>
    {#if allowed.includes('frowns') && post.frowns?.length}<span class='reaction frowns' title='Smutek'><img src='/svg/frown.svg' alt='Smutek' class='svg'><span class='count'>{post.frowns?.length}</span></span>{/if}
    {#if allowed.includes('laughs') && post.laughs?.length}<span class='reaction laughs' title='Smích'><img src='/svg/laugh.svg' alt='Smích' class='svg'><span class='count'>{post.laughs?.length}</span></span>{/if}
    {#if allowed.includes('shocks') && post.shocks?.length}<span class='reaction shocks' title='Šok'><img src='/svg/shock.svg' alt='Šok' class='svg'><span class='count'>{post.shocks?.length}</span></span>{/if}
    {#if allowed.includes('hearts') && post.hearts?.length}<span class='reaction hearts' title='Srdce'><img src='/svg/heart.svg' alt='Srdce' class='svg'><span class='count'>{post.hearts?.length}</span></span>{/if}
    {#if allowed.includes('thumbs') && post.thumbs?.length}<span class='reaction thumbs' title='Palec nahoru'><img src='/svg/thumb.svg' alt='Palec nahoru' class='svg'><span class='count'>{post.thumbs?.length}</span></span>{/if}
  </span>
{/if}

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
      min-width: 40px;
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
      min-width: 20px;
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
