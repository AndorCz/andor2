<script>
  import { writable } from 'svelte/store'
  import { waitForMediaLoad } from '@lib/utils'
  import { activeConversation, lightboxImage } from '@lib/stores'
  import { onMount, tick, onDestroy, afterUpdate } from 'svelte'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import ConversationPost from '@components/sidebar/ConversationPost.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user
  export let clearUnread

  let channel
  let inputEl
  let messagesEl
  let textareaValue = ''
  let previousMessagesLength = 0
  let scrollHandlerAttached = false

  // Pagination variables
  const pageSize = 20
  let isLoading = false
  let messageOffset = 0
  let hasMoreMessages = true
  let userHasScrolledUp = false
  let distanceFromBottom = 0

  const messages = writable([])
  const them = $activeConversation.them
  const us = $activeConversation.type === 'character' ? $activeConversation.us : user
  const senderColumn = $activeConversation.type === 'character' ? 'sender_character' : 'sender_user'
  const recipientColumn = $activeConversation.type === 'character' ? 'recipient_character' : 'recipient_user'

  const sortedIds = [us.id, them.id].sort() // create a unique channel name, the same for both participants

  function handleScroll () {
    distanceFromBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight
    userHasScrolledUp = distanceFromBottom > 50 // Threshold to consider as manual scroll
    if (messagesEl && hasMoreMessages && !isLoading) {
      if (messagesEl.scrollTop <= 50) { // 50px threshold from top
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
    // init conversation, listen for new messages in the conversation. we can listen to only 'us' in the recipient column
    const filter = `${recipientColumn}=eq.${us.id}` // not possible to filter for two columns at the moment, so we have to filter the sender on the client-side
    channel = supabase
      .channel(`private-chat-${sortedIds[0]}-${sortedIds[1]}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter }, (payload) => {
        if (payload.new[senderColumn] === them.id) { // only if the message is from the other participant
          $messages.push(payload.new)
          $messages = $messages // update store
          handleClearUnread() // Mark conversation as read when a new message arrives
        }
      })
      .subscribe()
  })

  onDestroy(() => {
    if (channel) { supabase.removeChannel(channel) }
    if (messagesEl && scrollHandlerAttached) {
      messagesEl.removeEventListener('scroll', handleScroll)
      scrollHandlerAttached = false
    }
  })

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  let conversationReadAt = null // Stores the ISO string timestamp of when 'us' last read this conversation
  let initialReadAtFetched = false // Flag to ensure fetchInitialReadAt runs only once per component lifecycle initially

  async function fetchInitialReadAt () {
    if (!us || !us.id || !them || !them.id) return
    const readerIdColumn = $activeConversation.type === 'character' ? 'reader_character_id' : 'reader_user_id'
    const peerIdColumn = $activeConversation.type === 'character' ? 'peer_character_id' : 'peer_user_id'
    const tableName = $activeConversation.type === 'character' ? 'read_character_conversations' : 'read_user_conversations'
    const { data } = await supabase.from(tableName).select('read_at').eq(readerIdColumn, us.id).eq(peerIdColumn, them.id).maybeSingle()
    conversationReadAt = data ? data.read_at : null // Set to null if no record found
  }

  // Function to determine if a message is unread based on conversationReadAt
  function isMessageUnread (message) {
    if (!conversationReadAt) return true // If conversation was never read, all messages are unread
    if (!message || !message.created_at) return false
    return new Date(message.created_at) > new Date(conversationReadAt)
  }

  // Function to load messages from the server
  async function loadMessages (initialLoad = true) {
    isLoading = true
    try {
      if (initialLoad && !initialReadAtFetched) {
        await fetchInitialReadAt()
        initialReadAtFetched = true
      }
      if (initialLoad) {
        messageOffset = 0
        hasMoreMessages = true
        $messages = []
        editingMessage = null // Reset editing state on full reload
      }

      let query
      if (us.id === user.id) { // load messages where are both recipientId and us.id (sender or recipient columns), sorted by created_at
        query = supabase.from('messages').select('*')
          .is('recipient_character', null)
          .is('sender_character', null)
          .or(`and(${recipientColumn}.eq.${them.id},${senderColumn}.eq.${us.id}),and(${recipientColumn}.eq.${us.id},${senderColumn}.eq.${them.id})`)
          .order('created_at', { ascending: false }) // Descending to get most recent first
          .range(messageOffset, messageOffset + pageSize - 1) // Get specific range
      } else { // game messages - filter out those sent by different user
        query = supabase.from('messages').select('*')
          .or(`and(recipient_character.eq.${us.id},recipient_user.eq.${user.id},sender_character.eq.${them.id}),and(sender_character.eq.${us.id},sender_user.eq.${user.id},recipient_character.eq.${them.id})`)
          .order('created_at', { ascending: false }) // Descending to get most recent first
          .range(messageOffset, messageOffset + pageSize - 1) // Get specific range
      }

      const { data, error } = await query
      if (error) { return handleError(error) }

      hasMoreMessages = data && data.length >= pageSize // Check if we have more messages to load
      messageOffset += data?.length || 0 // Update offset for next page load

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
        await tick() // ensure DOM is updated
        const newScrollHeight = messagesEl.scrollHeight
        messagesEl.scrollTop = scrollPosition + (newScrollHeight - scrollHeight)
      }
      if (initialLoad) { handleClearUnread() } // This will use 'now' as the read_at time
    } finally {
      isLoading = false
    }
  }

  async function handleClearUnread () {
    const now = new Date().toISOString()
    let success = false
    if ($activeConversation.type === 'character') {
      const { error: readError } = await supabase.from('read_character_conversations').upsert({ reader_character_id: us.id, peer_character_id: them.id, read_at: now }, { onConflict: 'reader_character_id, peer_character_id' })
      if (readError) { handleError(readError) }
      const { error: unreadError } = await supabase.from('unread_character_message_counts').update({ unread_count: 0 }).eq('recipient_character_id', us.id).eq('sender_character_id', them.id)
      if (unreadError) { handleError(unreadError) }
      if (!readError && !unreadError) success = true
      clearUnread(them.id, us.id)
    } else {
      const { error: readError } = await supabase.from('read_user_conversations').upsert({ reader_user_id: us.id, peer_user_id: them.id, read_at: now }, { onConflict: 'reader_user_id, peer_user_id' })
      if (readError) { handleError(readError) }
      const { error: unreadError } = await supabase.from('unread_user_message_counts').update({ unread_count: 0 }).eq('recipient_user_id', us.id).eq('sender_user_id', them.id)
      if (unreadError) { handleError(unreadError) }
      if (!readError && !unreadError) success = true
      clearUnread(them.id)
    }
    if (success) { conversationReadAt = now }
  }

  let editingMessage = null

  async function sendMessage () {
    if (textareaValue.trim() === '') return

    if (editingMessage) {
      const { error } = await supabase.from('messages').update({ content: textareaValue }).eq('id', editingMessage.id)
      if (error) { return handleError(error) }
      // Update message in local store
      const index = $messages.findIndex(m => m.id === editingMessage.id)
      if (index !== -1) {
        $messages[index].content = textareaValue
        $messages = $messages
      }
      textareaValue = ''
      editingMessage = null
    } else {
      // Insert new message
      const messageData = {
        content: textareaValue,
        ...(us.id !== user.id
          ? { sender_character: us.id, sender_user: user.id, recipient_character: them.id, recipient_user: them.player }
          : { [senderColumn]: us.id, [recipientColumn]: them.id })
      }
      const { data: newMessagesData, error } = await supabase.from('messages').insert(messageData).select()
      if (error) { return handleError(error) }
      textareaValue = ''
      $messages = [...$messages, ...newMessagesData]
    }
  }

  function onEdit (message) {
    editingMessage = message
    inputEl.triggerEdit(message.id, message.content)
  }

  async function onDelete (messageId) {
    const { error } = await supabase.from('messages').delete().eq('id', messageId)
    if (error) { return handleError(error) }
    $messages = $messages.filter(m => m.id !== messageId)
    tick().then(async () => { // Ensure DOM is updated
      await waitForMediaLoad(messagesEl) // Wait for all images and videos to load
      messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' })
    })
  }

  function onImageClickInPost (event) {
    if (event.target.tagName === 'IMG') {
      // Check if the image is inside a link (e.g. portrait)
      if (event.target.closest('a')) return
      $lightboxImage = event.target.src
    }
  }

  // Reactive statement for scrolling
  $: {
    if (messagesEl && $messages.length) {
      if (!userHasScrolledUp) { // Scroll to bottom for new messages from the other user, or on initial load if not scrolled up
        if (previousMessagesLength === 0 && $messages.length > 0) { // Initial load
          messagesEl.scrollTop = messagesEl.scrollHeight
        } else { // New message
          waitForMediaLoad(messagesEl).then(() => {
            if (messagesEl) {
              messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' })
            }
          })
        }
      }
      previousMessagesLength = $messages.length
    } else {
      previousMessagesLength = 0
    }
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
            <div class='loadingIndicator'>Načítám zprávy...</div>
          {:else if hasMoreMessages}
            <div class='loadingMore'>
              {#if isLoading}
                <div class='loadingIndicator'>Načítám starší zprávy...</div>
              {:else}
                <div class='loadHint'>Scrollujte nahoru pro načtení starších zpráv</div>
              {/if}
            </div>
          {/if}
          {#if $messages.length > 0}
            {#each $messages as message (message.id)}
              <ConversationPost {message} {us} {senderColumn} {onEdit} {onDelete} {isMessageUnread} onImageClickInPost={onImageClickInPost} />
            {/each}
          {:else}
            <center>Žádné zprávy</center>
          {/if}
        </div>
        <TextareaExpandable forceBubble {user} bind:this={inputEl} bind:value={textareaValue} onSave={sendMessage} minHeight={70} enterSend showButton allowHtml disableEmpty placeholder={editingMessage ? 'Upravit zprávu...' : 'Napsat zprávu...'} />
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
  .label {
    display: flex;
    flex-direction: column;
  }
  .subtitle {
    font-family: 'Alegreya Sans', Arial, Helvetica, sans-serif;
    color: var(--dim);
    font-size: 16px;
  }
  .messages {
    flex-grow: 1;
    display: flex;
    overflow-y: auto;
    padding-right: 10px;
    margin-bottom: 10px;
    flex-direction: column;
    border-top: 1px var(--block) solid;
  }
  .loadingIndicator, .loadHint {
    text-align: center;
    padding: 10px;
    color: var(--text-muted);
  }
  .loadingMore {
    min-height: 40px;
  }
  .error {
    color: var(--error);
    text-align: center;
    padding: 20px;
  }
  .loading {
    display: block;
    text-align: center;
    padding: 20px;
    font-style: italic;
    color: var(--text-muted);
  }
</style>
