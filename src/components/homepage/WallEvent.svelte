<script>
  import { getHeaderUrl, getPortraitUrl } from '@lib/database-browser'

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
  {#if item.header_hash}
    <a class='image' href={event.url} aria-label={`${event.label}: ${item.title}`}>
      <img src={getHeaderUrl(event.type, event.id, item.header_hash)} alt='' />
    </a>
  {/if}
  <div class='body'>
    <a class='title' href={event.url}>{item.title}</a>
    {#if item.summary}
      <div class='annotation' title={item.summary}>{item.summary}</div>
    {/if}
    <div class='meta'>
      <span class='event-type'><span class='material'>{event.icon}</span>{event.label}</span>
      <time datetime={item.created_at}>{date}</time>
      {#if item.author}
        <a href={`/user?id=${item.author.id}`} class='user owner' title='autor'>
          <span>{item.author.name}</span>
          {#if item.author.portrait}<img src={getPortraitUrl(item.author.id, item.author.portrait)} class='portrait' alt={item.author.name} />{/if}
        </a>
      {/if}
    </div>
  </div>
</article>

<style>
  .event {
    display: flex;
    min-height: 115px;
    margin: 10px 0px 5px;
    flex-direction: row-reverse;
    background: var(--block);
  }
  .image {
    width: 30%;
    overflow: hidden;
  }
    .image img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  .body {
    display: grid;
    min-width: 0;
    flex: 1;
    grid-template-columns: 1fr;
    padding: 20px 20px 10px;
  }
  .title {
    font-size: 24px;
    line-height: 1.15;
  }
  .annotation {
    overflow: hidden;
    padding: 5px 0px;
    color: var(--dim);
    font-style: italic;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-end;
    gap: 20px;
    color: var(--dim);
    font-size: 16px;
  }
    .event-type {
      display: flex;
      margin-right: auto;
      align-items: center;
      gap: 6px;
    }
      .event-type .material {
        color: var(--accent);
        font-size: 18px;
      }
    time {
      white-space: nowrap;
    }
  .owner {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
    .portrait {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: cover;
      object-position: center 20%;
      border-radius: 100%;
      background: var(--background);
    }

  @media (max-width: 500px) {
    .event {
      display: block;
      margin-bottom: 10px;
    }
    .image {
      width: 100%;
      height: 120px;
    }
    .body {
      padding: 15px 15px 10px;
    }
    .meta {
      flex-wrap: wrap;
      gap: 10px 15px;
    }
    .event-type {
      width: 100%;
    }
  }
</style>
