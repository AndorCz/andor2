<script>
  import { getHeaderUrl } from '@lib/database-browser'

  const { item } = $props()

  const event = $derived.by(() => {
    if (item.game_id) return { label: 'Nová skupinová hra', icon: 'groups', type: 'game', url: `/game/${item.game_id}`, id: item.game_id }
    if (item.solo_concept_id) return { label: 'Nová sólo hra', icon: 'person_play', type: 'solo', url: `/solo/concept/${item.solo_concept_id}`, id: item.solo_concept_id }
    if (item.work_id) return { label: 'Nové dílo', icon: 'auto_stories', type: 'work', url: `/work/${item.work_id}`, id: item.work_id }
    return { label: 'Nová diskuze', icon: 'forum', type: 'board', url: `/board/${item.board_id}`, id: item.board_id }
  })

  const date = $derived(new Date(item.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }))
</script>

<article class='event'>
  <a class='visual' href={event.url} aria-label={`${event.label}: ${item.title}`}>
    {#if item.header_hash}
      <img src={getHeaderUrl(event.type, event.id, item.header_hash)} alt='' />
    {:else}
      <span class='material placeholder'>{event.icon}</span>
    {/if}
  </a>
  <div class='body'>
    <div class='meta'>
      <span class='material'>{event.icon}</span>
      <span>{event.label}</span>
      <time datetime={item.created_at}>{date}</time>
    </div>
    <a class='title' href={event.url}>{item.title}</a>
    {#if item.summary}
      <p>{item.summary}</p>
    {/if}
    <a class='open' href={event.url}>otevřít <span class='material'>arrow_forward</span></a>
  </div>
</article>

<style>
  .event {
    display: grid;
    grid-template-columns: minmax(150px, 32%) 1fr;
    min-height: 150px;
    margin: 10px 0px 20px;
    overflow: hidden;
    background: color-mix(in srgb, var(--panel) 82%, var(--accent) 18%);
    border-left: 4px solid var(--accent);
  }
  .visual {
    min-height: 150px;
    color: var(--accent);
    background: var(--block);
  }
    .visual img {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 150px;
      object-fit: cover;
    }
    .placeholder {
      display: flex;
      width: 100%;
      height: 100%;
      min-height: 150px;
      align-items: center;
      justify-content: center;
      font-size: 52px;
      opacity: 0.65;
    }
  .body {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    padding: 18px 22px 16px;
  }
  .meta {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 7px;
    color: var(--dim);
    font-size: 15px;
    letter-spacing: 0.02em;
  }
    .meta .material {
      color: var(--accent);
      font-size: 19px;
    }
    .meta time {
      margin-left: auto;
      white-space: nowrap;
    }
  .title {
    margin-top: 8px;
    font-family: var(--headlineFont);
    font-size: 27px;
    line-height: 1.15;
  }
  p {
    display: -webkit-box;
    margin: 8px 0px 10px;
    overflow: hidden;
    color: var(--text);
    font-size: 17px;
    line-height: 1.35;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .open {
    display: inline-flex;
    margin-top: auto;
    align-items: center;
    gap: 4px;
    font-size: 16px;
  }
    .open .material {
      font-size: 18px;
    }

  @media (max-width: 600px) {
    .event {
      grid-template-columns: 1fr;
    }
    .visual, .visual img, .placeholder {
      min-height: 110px;
      max-height: 150px;
    }
    .body {
      padding: 15px 17px;
    }
    .meta {
      flex-wrap: wrap;
    }
    .meta time {
      width: 100%;
      margin-left: 26px;
    }
    .title {
      font-size: 24px;
    }
  }
</style>
