<script>
  import { onMount, tick, onDestroy, afterUpdate } from 'svelte'
  import { writable } from 'svelte/store'
  import { tooltip } from '@lib/tooltip'
  import { Render } from '@jill64/svelte-sanitize'
  import { activeConversation, lightboxImage } from '@lib/stores'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user

  let previousMessagesLength = 0
  let textareaValue = ''
  let messagesEl
  let inputEl
  let channel
  let scrollHandlerAttached = false

  // Pagination variables
  let isLoading = false
  let hasMoreMessages = true
  let messageOffset = 0
  const PAGE_SIZE = 20

  // Flag to track if user has manually scrolled up
  let userHasScrolledUp = false

  // Track the distance from the bottom of the scroll container
  let distanceFromBottom = 0

  const messages = writable([])
  const them = $activeConversation.them
  const us = $activeConversation.type === 'character' ? $activeConversation.us : user
  const senderColumn = $activeConversation.type === 'character' ? 'sender_character' : 'sender_user'
  const recipientColumn = $activeConversation.type === 'character' ? 'recipient_character' : 'recipient_user'

  const sortedIds = [us.id, them.id].sort() // create a unique channel name, the same for both participants

  // Function to load more messages when scrolling to top
  function handleScroll () {
    // Update the distance from the bottom
    distanceFromBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight

    // Check if user has manually scrolled up
    userHasScrolledUp = distanceFromBottom > 50

    if (messagesEl && hasMoreMessages && !isLoading) {
      // Check if user has scrolled to the top (with a small threshold)
      if (messagesEl.scrollTop <= 50) {
        loadMessages(false) // Load more messages, not initial load
      }
    }
  }

  // Ensure the scroll handler is attached after the component is mounted and updated
  afterUpdate(() => {
    if (messagesEl && !scrollHandlerAttached) {
      messagesEl.addEventListener('scroll', handleScroll)
      scrollHandlerAttached = true
    }
  })

  onMount(() => {
    // init conversation, listen for new messages in the conversation. we can listen to only "us" in the recipient column
    const filter = `${recipientColumn}=eq.${us.id}` // not possible to filter for two columns at the moment, so we have to filter the sender on the client-side
    channel = supabase
      .channel(`private-chat-${sortedIds[0]}-${sortedIds[1]}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter }, (payload) => {
        if (payload.new[senderColumn] === them.id) { // only if the message is from the other participant
          $messages.push(payload.new)
          $messages = $messages // update store
        }
      })
      .subscribe()
  })

  onDestroy(() => {
    if (channel) { supabase.removeChannel(channel) }
    // Remove scroll event listener on component destroy
    if (messagesEl && scrollHandlerAttached) {
      messagesEl.removeEventListener('scroll', handleScroll)
      scrollHandlerAttached = false
    }
  })

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  async function loadMessages (initialLoad = true) {
    isLoading = true

    try {
      if (initialLoad) { // Reset pagination variables on initial load
        messageOffset = 0
        hasMoreMessages = true
        $messages = []
      }

      let query

      if (us.id === user.id) {
        // load messages where are both recipientId and us.id (sender or recipient columns), sorted by created_at
        query = supabase.from('messages').select('*')
          .is('recipient_character', null)
          .is('sender_character', null)
          .or(`and(${recipientColumn}.eq.${them.id},${senderColumn}.eq.${us.id}),and(${recipientColumn}.eq.${us.id},${senderColumn}.eq.${them.id})`)
          .order('created_at', { ascending: false }) // Descending to get most recent first
          .range(messageOffset, messageOffset + PAGE_SIZE - 1) // Get specific range
      } else {
        // Game messages - filter out those sent by different user
        query = supabase.from('messages').select('*')
          .or(`and(recipient_character.eq.${us.id},recipient_user.eq.${user.id},sender_character.eq.${them.id}),and(sender_character.eq.${us.id},sender_user.eq.${user.id},recipient_character.eq.${them.id})`)
          .order('created_at', { ascending: false }) // Descending to get most recent first
          .range(messageOffset, messageOffset + PAGE_SIZE - 1) // Get specific range
      }

      const { data, error } = await query
      if (error) { return handleError(error) }

      // Check if we have more messages to load
      hasMoreMessages = data && data.length >= PAGE_SIZE

      // Update offset for next page load
      messageOffset += data?.length || 0

      // Add messages to the store (newest messages are loaded first, so we need to prepend them)
      if (initialLoad) {
        // Reverse to get chronological order (oldest first)
        $messages = data ? data.reverse() : []
      } else if (data && data.length > 0) {
        // When loading more (older) messages, add them to the beginning
        const scrollHeight = messagesEl.scrollHeight
        const scrollPosition = messagesEl.scrollTop

        // Prepend older messages to the beginning
        $messages = [...data.reverse(), ...$messages]

        // After the DOM updates, restore the scroll position
        tick().then(() => {
          const newScrollHeight = messagesEl.scrollHeight
          messagesEl.scrollTop = scrollPosition + (newScrollHeight - scrollHeight)
        })
      }
      if (initialLoad) { clearUnread() }
    } finally {
      isLoading = false
    }
  }

  async function clearUnread () {
    const myUnreadMessages = $messages.filter(message => message[recipientColumn] === us.id) // only where we are the sender
    if (myUnreadMessages.length) {
      const { error } = await supabase.from('messages').update({ read: true }).in('id', myUnreadMessages.map(message => message.id))
      if (error) { return handleError(error) }
    }
  }

  async function sendMessage () {
    if (us.id !== user.id) {
      // Game messages - insert both sender and character ids
      const { error } = await supabase.from('messages').insert({ content: textareaValue, sender_character: us.id, sender_user: user.id, recipient_character: them.id, recipient_user: them.player })
      if (error) { return handleError(error) }
    } else {
      const { error } = await supabase.from('messages').insert({ content: textareaValue, [senderColumn]: us.id, [recipientColumn]: them.id })
      if (error) { return handleError(error) }
    }
    textareaValue = ''
    await loadMessages()
  }

  function getTooltip (message) {
    const name = message[senderColumn] === us.id ? us.name : them.name
    const date = new Date(message.created_at)
    return `${name}: ${date.toLocaleDateString('cs')} - ${date.toLocaleTimeString('cs')}`
  }

  function onImageClick (event) {
    if (event.target.tagName === 'IMG') { $lightboxImage = event.target.src }
  }

  // Reactive statement for scrolling
  $: if (messagesEl && $messages.length) {
    if (!userHasScrolledUp) {
      if (previousMessagesLength === 0 && $messages.length > 0) {
        // Instant scroll for the initial load
        messagesEl.scrollTop = messagesEl.scrollHeight
      } else if (previousMessagesLength < $messages.length) {
        // Smooth scroll for subsequent updates (new messages)
        tick().then(() => {
          // Smooth scroll to the bottom
          messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' })
          previousMessagesLength = $messages.length // update count
        })
      }
    }
    previousMessagesLength = $messages.length // Update the length after scrolling
  }
</script>

{#await waitForAnimation() then}
  <div id='conversation'>
    <button on:click={() => { $activeConversation = null }} id='close' title='zavřít' class='material'>close</button>
    {#if us.id && them.id}
      {#await loadMessages()}
        <span class='loading'>Načítám konverzaci...</span>
      {:then}
        <h2>
          {#if them.portrait}
            <img src={getPortraitUrl(them.id, them.portrait)} class='portrait' alt={them.name} />
          {/if}
          <div class='label'>
            {#if $activeConversation.type === 'character'}
              <a href='/game/character?id={them.id}' class='name character'>{them.name}</a>
            {:else}
              <a href='/user?id={them.id}' class='name user'>{them.name}</a>
            {/if}
            <div class='subtitle'>soukromá konverzace</div>
          </div>
        </h2>

        <div class='messages' bind:this={messagesEl} on:scroll={handleScroll}>
          {#if isLoading && !$messages.length}
            <div class="loading-indicator">Načítám zprávy...</div>
          {:else if hasMoreMessages}
            <div class="loading-more">
              {#if isLoading}
                <div class="loading-indicator">Načítám starší zprávy...</div>
              {:else}
                <div class="load-more-hint">Scrollujte nahoru pro načtení starších zpráv</div>
              {/if}
            </div>
          {/if}
          {#if $messages.length > 0}
            {#each $messages as message}
              <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
              <div class='post' on:click={onImageClick}>
                <div use:tooltip class='content {message[senderColumn] === us.id ? 'mine' : 'theirs'}' title={getTooltip(message)}>
                  {#if !message.read && message[senderColumn] !== us.id}
                    <div class='badge'></div>
                  {/if}
                  <Render html={message.content} options={{ dompurify: { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] } }} />
                </div>
              </div>
              <div class='clear'></div>
            {/each}
          {:else}
            <center>Žádné zprávy</center>
          {/if}
        </div>
        <TextareaExpandable forceBubble {user} bind:this={inputEl} bind:value={textareaValue} onSave={sendMessage} minHeight={70} enterSend showButton allowHtml disableEmpty />
      {:catch error}
        <span class='error'>Konverzaci se nepodařilo načíst</span>
      {/await}
    {:else}
      <span class='error'>Konverzace nenalezena</span>
    {/if}
  </div>
{/await}

<style>
  #conversation {
    position: relative;
    background-color: var(--panel);
    border-radius: 10px;
    padding: 20px;
    margin-top: 20px;
    width: 100%;
    height: calc(100svh - 40px);
    display: flex;
    flex-direction: column;
  }
    #close {
      position: absolute;
      top: 0px;
      right: 0px;
      padding: 5px;
      border-radius: 0px 10px 0px 10px;
    }
    h2 {
      margin-top: 0px;
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 1px var(--background) solid;
      padding-bottom: 20px;
      margin-bottom: 0px;
    }
      .name {
        font-size: 30px;
      }
      .portrait {
        display: block;
        width: 70px;
        height: 70px;
        object-fit: cover;
        object-position: center 10%;
        border-radius: 10px;
        box-shadow: 2px 2px 3px #0003;
      }
      .subtitle {
        font-size: 16px;
        color: var(--dim);
        font-family: 'Alegreya Sans', Arial, Helvetica, sans-serif;
      }
    .loading, .error {
      text-align: center;
    }
    .loading {
      font-style: italic;
    }
    .error {
      color: var(--error);
    }

    .messages {
      border-top: 1px var(--block) solid;
      flex: 1;
      overflow-y: auto;
      padding: 20px 20px 10px 20px;
    }
      .clear {
        clear: both;
        overflow: auto;
      }
      .post {
        margin: 5px 0px;
      }
        .content {
          position: relative;
          max-width: 90%;
          padding: 10px 20px;
          overflow-wrap: anywhere;
        }
          .theirs {
            border-radius: 20px 20px 20px 0px;
            background-color: var(--block);
            text-align: left;
            float: left;
          }
          .mine {
            border-radius: 20px 20px 0px 20px;
            background-color: var(--prominent);
            color: var(--gray90);
            text-align: right;
            float: right;
          }

    /* Loading indicator */
    .loading-indicator {
      text-align: center;
      padding: 10px;
      font-style: italic;
      color: var(--dim);
    }

    .loading-more {
      text-align: center;
      padding: 5px;
      margin-bottom: 15px;
      border-bottom: 1px dashed var(--block);
    }

    .load-more-hint {
      font-size: 0.9em;
      color: var(--dim);
      padding: 5px;
    }
</style>
