<script>
  import Loading from '@components/common/Loading.svelte'
  import DOMPurify from 'dompurify'
  import { formatDate } from '@lib/utils'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'

  const { user } = $props()

  let loading = $state(false)
  let results = $state([])
  let searchTerm = $state('')
  let hasSearched = $state(false)
  let errorMessage = $state('')

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

  function createGroupedResults (items) {
    if (!Array.isArray(items) || items.length === 0) {
      return []
    }
    const groups = new Map()
    items.forEach(item => {
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
            reward_link: item.contact_reward_link,
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
  }

  const groupedResults = $derived(createGroupedResults(results))

  function sanitizeContent (content) {
    return DOMPurify.sanitize(content || '', { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })
  }
</script>

<section>
  <h1>Hledat v konverzacích</h1>
  <form onsubmit={handleSearch}>
    <input type='text' placeholder='Vyhledejte zprávy podle klíčových slov' bind:value={searchTerm} aria-label='Hledaný výraz' autofocus />
    <button type='submit' class='material square' disabled={loading}>
      {#if loading}hourglass_top{:else}search{/if}
    </button>
  </form>
  {#if errorMessage}<div class='error'>{errorMessage}</div>{/if}
  {#if loading}
    <div class='status'><Loading /></div>
  {:else if hasSearched}
    {#if groupedResults.length}
      <div class='results'>
        {#each groupedResults as group (group.key)}
          <article class='result-group'>
            <header>
              <img src={getPortraitUrl(group.contact.id, group.contact.portrait)} alt={group.contact.name} class='portrait' />
              <div class='title'>
                <a href={group.contact.link} class={group.contact.type}>
                  {group.contact.name}
                </a>
                <div class='meta'>
                  <span class={`type ${group.contact.type}`}>
                    {group.contact.type === 'character' ? 'Postava' : 'Hráč'}
                  </span>
                </div>
              </div>
            </header>
            <div class='messages'>
              {#each group.messages as message (message.message_id)}
                <div class={'message ' + message.message_direction}>
                  {#if message.message_direction === 'incoming'}
                    {#if group.contact.portrait}
                      <img src={getPortraitUrl(group.contact.id, group.contact.portrait)} alt={group.contact.name} class='portrait' />
                    {:else if group.contact.type === 'character'}
                      <img src='/default_char.png' alt='Postava' class='portrait' />
                    {:else}
                      <img src='/default_user.png' alt='Hráč' class='portrait' />
                    {/if}
                  {:else}
                    <img src={getPortraitUrl(user.id, user.portrait)} class='portrait' />
                  {/if}
                  <div class='message-wrapper'>
                    <span class='time'>{formatDate(message.message_created_at)}</span>
                    <div class='message-content'>{@html sanitizeContent(message.message_content)}</div>
                  </div>
                </div>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <div class='status'>Nebyl nalezen žádný výsledek.</div>
    {/if}
  {/if}
</section>

<style>
  section {
    min-height: 300px;
  }
    h1 {
      margin-top: 0px;
      margin-bottom: 30px;
    }
    form {
      display: flex;
      gap: 15px;
      align-items: center;
      justify-content: center;
    }
      input {
        flex: 1;
      }
    .error, .status {
      position: relative;
      margin-top: 50px;
      text-align: center;
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
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 25px;
    }
      .result-group {
        padding: 20px;
        border-radius: 12px;
        background: var(--block);
      }
        .result-group header {
          display: flex;
          gap: 15px;
          align-items: center;
          margin-bottom: 15px;
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
          .meta {
            display: flex;
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
      .messages {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .message-wrapper {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
        .time {
          color: var(--dim);
        }
        .portrait {
          width: 64px;
          height: 64px;
          object-fit: cover;
          object-position: center 20%;
          border-radius: 10px;
          box-shadow: 2px 2px 3px #0003;
        }
        .message {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }
          .message.outgoing {
            flex-direction: row-reverse;
            text-align: right;
          }
</style>
