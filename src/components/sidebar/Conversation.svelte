<script>
  import { onMount, tick, onDestroy } from 'svelte'
  import { writable } from 'svelte/store'
  import { tooltip } from '@lib/tooltip'
  import { activeConversation } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user

  let previousMessagesLength = 0
  let textareaValue = ''
  let messagesEl
  let inputEl
  let channel

  const messages = writable([])

  const them = $activeConversation.them
  const us = $activeConversation.type === 'character' ? $activeConversation.us : user
  const senderColumn = $activeConversation.type === 'character' ? 'sender_character' : 'sender_user'
  const recipientColumn = $activeConversation.type === 'character' ? 'recipient_character' : 'recipient_user'

  const sortedIds = [us.id, them.id].sort() // create a unique channel name, the same for both participants

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

  onDestroy(() => { if (channel) { supabase.removeChannel(channel) } })

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  async function loadMessages () {
    // load messages where are both recipientId and user.id (sender or recipient columns), sorted by created_at
    const { data, error } = await supabase.from('messages').select('*')
      .or(`and(${recipientColumn}.eq.${them.id},${senderColumn}.eq.${us.id}),and(${recipientColumn}.eq.${us.id},${senderColumn}.eq.${them.id})`)
      .order('created_at', { ascending: true })
    if (error) { return handleError(error) }
    $messages = data
    markMessagesRead()
  }

  async function markMessagesRead () {
    const myUnreadMessages = $messages.filter(message => message[recipientColumn] === us.id && !message.read) // only where we are the recipient
    if (myUnreadMessages.length) {
      const { error } = await supabase.from('messages').update({ read: true }).in('id', myUnreadMessages.map(message => message.id))
      if (error) { return handleError(error) }
    }
  }

  async function sendMessage () {
    const { error } = await supabase.from('messages').insert({ content: textareaValue, [senderColumn]: us.id, [recipientColumn]: them.id })
    if (error) { return handleError(error) }
    textareaValue = ''
    await loadMessages()
  }

  function getTooltip (message) {
    const name = message[senderColumn] === us.id ? us.name : them.name
    const date = new Date(message.created_at)
    return `${name}: ${date.toLocaleDateString('cs')} - ${date.toLocaleTimeString('cs')}`
  }
  // Reactive statement for scrolling
  $: if (messagesEl && $messages.length) {
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
            <img src={them.portrait} class='portrait' alt='portrait'>
          {/if}
          <div class='label'>
            <div class='name'>{them.name}</div>
            <div class='subtitle'>soukromá konverzace</div>
          </div>
        </h2>

        <div class='messages' bind:this={messagesEl}>
          {#if $messages.length > 0}
            {#each $messages as message}
              <div class='messageRow'>
                <!-- add tippy for time -->
                <div use:tooltip class='message {message[senderColumn] === user.id ? 'mine' : 'theirs'}' title={getTooltip(message)}>
                  <!-- add 'read' column -->
                  {#if !message.read && message.sender !== user.id}
                    <div class='badge'></div>
                  {/if}
                  {message.content}
                </div>
              </div>
              <div class='clear'></div>
            {/each}
          {:else}
            <center>Žádné zprávy</center>
          {/if}
        </div>
        <TextareaExpandable bind:this={inputEl} bind:value={textareaValue} onSave={sendMessage} showButton={true} minHeight={70} enterSend disableEmpty />
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
    position: fixed;
    right: 20px;
    top: 20px;
    background-color: var(--panel);
    border-radius: 10px;
    padding: 20px;
    width: 400px;
    height: calc(100vh - 40px);
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
      .portrait {
        display: block;
        width: 70px;
        height: 70px;
        object-fit: cover;
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
      overflow-y: scroll;
      scrollbar-width: thin;
      padding: 20px 20px 10px 20px;
    }
      .clear {
        clear: both;
        overflow: auto;
      }
      .messageRow {
        margin: 5px 0px;
      }
        .message {
          position: relative;
          max-width: 90%;
          padding: 10px 20px;
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
</style>
