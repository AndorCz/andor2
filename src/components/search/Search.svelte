<script>
  import DOMPurify from 'dompurify'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import { formatDate } from '@lib/utils'

  let searchTerm = $state('')
  let loading = $state(false)
  let errorMessage = $state('')
  let hasSearched = $state(false)
  let results = $state([])

  async function handleSearch (event) {
    event.preventDefault()
    const query = searchTerm.trim()
    if (!query) {
      errorMessage = 'Zadejte hledaný výraz.'
      hasSearched = false
      results = []
      return
    }
    errorMessage = ''
    loading = true
    results = []
    try {
      const { data, error } = await supabase.rpc('search_conversations', { search_term: query })
      if (error) { handleError(error) }
      results = data || []
      hasSearched = true
    } catch (error) {
      hasSearched = false
      if (error?.message) { errorMessage = error.message }
    } finally {
      loading = false
    }
  }

  const linkByType = {
    user: id => `/user?id=${id}`,
    character: id => `/game/character?id=${id}`
  }

  $: groupedResults = (() => {
    const groups = new Map()
    results.forEach(item => {
      const key = `${item.contact_type}:${item.contact_id}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          contact: {
            id: item.contact_id,
            type: item.contact_type,
            name: item.contact_name,
            portrait: item.contact_portrait,
            reward_icon: item.contact_reward_icon,
            link: linkByType[item.contact_type] ? linkByType[item.contact_type](item.contact_id) : '#'
          },
          messages: []
        })
      }
      groups.get(key).messages.push(item)
    })
    return Array.from(groups.values()).map(group => ({
      ...group,
      messages: group.messages.slice().sort((a, b) => new Date(b.message_created_at) - new Date(a.message_created_at))
    })).sort((a, b) => new Date(b.messages[0]?.message_created_at || 0) - new Date(a.messages[0]?.message_created_at || 0))
  })()

  function sanitizeContent (content) {
    return DOMPurify.sanitize(content || '', { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })
  }
</script>

<section class='conversation-search'>
  <h1>Hledat v konverzacích</h1>
  <form class='search-form' onsubmit={handleSearch}>
    <input
      type='text'
      placeholder='Vyhledejte zprávy podle klíčových slov'
      bind:value={searchTerm}
      aria-label='Hledaný výraz'
    />
    <button type='submit' class='material' disabled={loading}>
      {#if loading}
        hourglass_top
      {:else}
        search
      {/if}
    </button>
  </form>
  {#if errorMessage}
    <div class='error'>{errorMessage}</div>
  {/if}
  {#if loading}
    <div class='status'>Vyhledávám…</div>
  {:else if hasSearched}
    {#if groupedResults.length}
      <div class='results'>
        {#each groupedResults as group (group.key)}
          <article class='result-group'>
            <header>
              {#if group.contact.portrait}
                <img src={getPortraitUrl(group.contact.id, group.contact.portrait)} alt={group.contact.name} class='portrait' />
              {/if}
              <div class='title'>
                <a href={group.contact.link} class={group.contact.type}>
                  {group.contact.name}
                </a>
                <div class='meta'>
                  <span class={`type ${group.contact.type}`}>
                    {group.contact.type === 'character' ? 'Postava' : 'Hráč'}
                  </span>
                  {#if group.contact.reward_icon && group.contact.type === 'user'}
                    <span class='reward-icon'>{group.contact.reward_icon}</span>
                  {/if}
                </div>
              </div>
            </header>
            <ul>
              {#each group.messages as message (message.message_id)}
                <li>
                  <div class='message-meta'>
                    <span class={`direction ${message.message_direction}`}>
                      {message.message_direction === 'outgoing' ? 'Odesláno' : 'Přijato'}
                    </span>
                    <span class='time'>{formatDate(message.message_created_at)}</span>
                  </div>
                  <div class='message-content'>{@html sanitizeContent(message.message_content)}</div>
                </li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
    {:else}
      <div class='status'>Nebyl nalezen žádný výsledek.</div>
    {/if}
  {/if}
</section>

<style>
  .conversation-search {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  h1 {
    margin: 0;
    font-size: 36px;
  }
  .search-form {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  .search-form input {
    flex: 1;
    padding: 12px 16px;
    font-size: 20px;
    border: 2px solid var(--prominent);
    border-radius: 10px;
    background: var(--block);
    color: inherit;
  }
  .search-form button {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    font-size: 28px;
    border-radius: 10px;
    padding: 0;
  }
  .error {
    color: var(--warning);
    font-weight: bold;
  }
  .status {
    color: var(--dim);
    font-style: italic;
  }
  .results {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  .result-group {
    padding: 20px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--panel) 94%, #fff 6%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
  .result-group header {
    display: flex;
    gap: 15px;
    align-items: center;
    margin-bottom: 15px;
  }
  .portrait {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  .title {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .title a {
    font-size: 24px;
    font-weight: 600;
    text-decoration: none;
  }
  .title a.user {
    color: var(--link);
  }
  .title a.character {
    color: var(--prominent);
  }
  .meta {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 14px;
    color: var(--dim);
  }
  .type {
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 12px;
    border: 1px solid var(--dim);
  }
  .type.character {
    border-color: var(--prominent);
    color: var(--prominent);
  }
  .type.user {
    border-color: var(--link);
    color: var(--link);
  }
  .reward-icon {
    font-size: 18px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  li {
    padding: 15px;
    border-radius: 10px;
    background: var(--block);
  }
  .message-meta {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 10px;
    color: var(--dim);
  }
  .direction {
    font-weight: 600;
    text-transform: uppercase;
  }
  .direction.outgoing {
    color: var(--prominent);
  }
  .direction.incoming {
    color: var(--link);
  }
  .message-content {
    font-size: 16px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .message-content :global(img) {
    max-width: 100%;
    border-radius: 6px;
  }

  @media (max-width: 720px) {
    .search-form {
      flex-direction: column;
      align-items: stretch;
    }
    .search-form button {
      width: 100%;
    }
    .result-group header {
      align-items: flex-start;
    }
    .message-meta {
      flex-direction: column;
      gap: 6px;
      align-items: flex-start;
    }
  }
</style>
