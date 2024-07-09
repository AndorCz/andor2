<script>
  import { onMount } from 'svelte'
  import { getPortraitUrl } from '@lib/database-browser'
  import { platform } from '@components/common/MediaQuery.svelte'
  import { Render } from '@jill64/svelte-sanitize'
  import { formatDate } from '@lib/utils'

  export let item = []

  let trimmed = true
  let textEl

  const iconSize = 70
  const textMaxHeight = 200

  const subHeadline = {
    game: 'Nová hra',
    work: 'Nové dílo',
    board: 'Nová diskuze'
  }
  const buttonText = {
    game: 'Otevřít hru',
    work: 'Otevřít dílo',
    board: 'Otevřít diskuzi'
  }
  const path = {
    game: '/game/',
    work: '/work/',
    board: '/board/'
  }

  onMount(() => {
    trimmed = textEl.scrollHeight > textMaxHeight
  })
</script>

{#if item.content_type === 'post'}
  <div class='item' style='--textMaxHeight: {textMaxHeight}px'>
    {#if subHeadline[item.content_type] || item.subheadline}
      <h4 class='subheadline'>{subHeadline[item.content_type] || item.subheadline}</h4>
    {/if}
    {#if item.content_type === 'post' && item.url}
      <a href={item.url}><h2 class='headline'>{item.title}</h2></a>
    {:else if item.content_id}
      <a href={path[item.content_type] + item.content_id}><h2 class='headline'>{item.title}</h2></a>
    {:else}
      <h2 class='headline'>{item.title}</h2>
    {/if}
    <div class={'post ' + $platform}>
      {#if $platform === 'desktop'}
        <div class='icon' style='--iconSize: {iconSize}px'>
          <img src={getPortraitUrl(item.character, 'fixed_hash')} class='portrait' alt='Portrét postavy' />
        </div>
      {/if}
      <div class='body'>
        <div class='header'>
          <span class='title'>
            <a href={'/game/character?id=' + item.character} class='user'>{item.character_name}</a>
          </span>
          <span class='toolbar'>
            <span class='time'>{formatDate(item.created_at)}</span>
          </span>
        </div>
        <div class='content' class:trimmed bind:this={textEl}>
          {#if $platform === 'mobile'}
            <div class='icon' style='--iconSize: {iconSize}px'>
              <img src={getPortraitUrl(item.character, 'fixed_hash')} class='portrait' alt='Portrét postavy' />
            </div>
          {/if}
          <Render html={item.content} options={{ dompurify: { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] } }} />
          <div class='clear'></div>
          {#if trimmed}
            <div class='expand'>
              <button on:click={() => { trimmed = false }} class='material'>unfold_more</button>
            </div>
          {/if}
        </div>
        <div class='row details'>
          {#if item.content_type === 'post' && item.url}
            <a href={item.url} class='button'>{item.button_text || buttonText[item.content_type] || 'Otevřít'}</a>
          {:else if item.content_id}
            <a href={path[item.content_type] + item.content_id} class='button'>{item.button_text || buttonText[item.content_type] || 'Otevřít'}</a>
          {/if}
          {#if item.owner}
            <a href='./user?id={item.owner.id}' class='owner user' title='autor'>
              <span>{item.owner.name}</span>
              {#if item.owner.portrait}<img src={getPortraitUrl(item.owner.id, item.owner.portrait)} class='icon' alt={item.owner.name} />{/if}
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class='item promo' style='--textMaxHeight: {textMaxHeight}px'>
    {#if item.image_url}
      <img class='image' src={item.image_url} alt='Upoutávka' />
    {/if}
    {#if item.subheadline || subHeadline[item.content_type]}
      <h4 class='subheadline'>{item.subheadline || subHeadline[item.content_type]}</h4>
    {/if}
    {#if item.content_id}
      <a href={path[item.content_type] + item.content_id}><h2 class='headline'>{item.title}</h2></a>
    {:else}
      <a href={item.url}><h2 class='headline'>{item.title}</h2></a>
    {/if}
    <div class='content' class:trimmed bind:this={textEl}>
      <Render html={item.content} options={{ dompurify: { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] } }} />
      {#if trimmed}
        <div class='expand'>
          <button on:click={() => { trimmed = false }} class='material'>unfold_more</button>
        </div>
      {/if}
    </div>
    <div class='row details'>
      {#if item.content_id}
        <a href={path[item.content_type] + item.content_id} class='button'>{item.button_text || buttonText[item.content_type] || 'Otevřít'}</a>
      {:else}
        <a href={item.url} class='button' target='_blank'>{item.button_text || 'Otevřít'}</a>
      {/if}
      {#if item.owner}
        <a href='./user?id={item.owner.id}' class='owner user' title='autor'>
          <span>{item.owner.name}</span>
          {#if item.owner.portrait}<img src={getPortraitUrl(item.owner.id, item.owner.portrait)} class='icon' alt={item.owner.name} />{/if}
        </a>
      {/if}
    </div>
  </div>
{/if}

<style>
  .headline, .subheadline {
    margin: 0px;
  }
    .headline {
      margin-bottom: 20px;
    }

  /* Type 'text' / 'game' / 'work' / 'board' */

  .item {
    margin-bottom: 20px;
  }
    .promo {
      padding: 20px;
      background-color: var(--block);
    }
    .item .image {
      width: 100%;
      max-height: 159px;
      object-fit: cover;
      margin-bottom: 10px;
    }
    .item .content {
      position: relative;
    }
    .trimmed {
      overflow: hidden;
      max-height: var(--textMaxHeight);
    }
    .item .owner {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
      .owner .icon {
        display: block;
        width: 40px;
        height: 40px;
        object-fit: cover;
        object-position: center 20%;
        border-radius: 100%;
        background-color: var(--background);
      }
    .item .details {
      margin-top: 20px;
    }
    .item .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Type 'post' */

    .post {
      position: relative;
      display: flex;
      width: 100%;
      margin-top: 10px;
      padding-bottom: 10px;
      text-align: left;
      gap: 10px;
    }
      .post .icon {
        width: var(--iconSize);
        overflow: hidden;
        position: relative;
      }
        .post .icon img {
          display: block;
        }
        .post.desktop .icon img {
          position: absolute;
          top: 0px;
          left: 0px;
          width: 100%;
          display: block;
        }
        .post.mobile .icon {
          border: 1px solid var(--panel);
          float: left;
          margin-right: 15px;
          margin-bottom: 15px;
        }
      .post .body {
        flex: 1;
        overflow: hidden;
      }
        .post .content {
          background-color: var(--block);
          padding: 20px;
          overflow-wrap: anywhere;
          position: relative;
        }
        .post .header {
          position: relative;
          width: 100%;
          min-height: 50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom: 1px var(--panel) solid;
          background-color: var(--block);
          padding: 5px 15px;
          color: var(--dim);
        }
          .title {
            flex: 1;
          }
          .time {
            font-family: arial, sans-serif;
            font-size: 14px;
            opacity: 0.7;
            margin-right: 5px;
          }
            .time:hover {
              opacity: 1;
              color: var(--text);
            }
        .clear {
          clear: both;
        }

  .expand {
    position: absolute;
    bottom: 0px;
    width: 100%;
    text-align: center;
    padding: 10px;
    padding-top: 50px;
    background: linear-gradient(transparent, var(--block));
  }
    .expand button {
      border-radius: 100%;
      padding: 10px;
    }

  @media (max-width: 860px) {
    .post {
      gap: 0px;
    }
    .post .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0px;
      padding: 10px 10px 5px 10px;
      padding-left: 15px;
    }
      .post .toolbar .time {
        flex: 1;
      }
    .post .content {
      padding: 15px;
    }
  }
</style>
