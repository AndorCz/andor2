<script>
  import { writable } from 'svelte/store'
  import { tooltip } from '@lib/tooltip'
  import { supabase, handleError } from '@lib/database'
  import { onMount, afterUpdate, onDestroy } from 'svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user
  export let userStore

  let contact = {}
  let textareaValue = ''
  let messagesEl
  let inputEl
  let channel

  const messages = writable([])
  const contactId = $userStore.openChat.contactId
  const sortedIds = [user.id, contactId].sort() // create a unique channel name, the same for both participants

  const senderColumn = $userStore.openChat.contactType === 'character' ? 'sender_character' : 'sender_user'
  const recipientColumn = $userStore.openChat.contactType === 'character' ? 'recipient_character' : 'recipient_user'
  const profileTable = $userStore.openChat.contactType === 'character' ? 'characters' : 'profiles'

  onMount(() => {
    // init conversation, listen for new messages in the conversation
    channel = supabase
      .channel(`private-chat-${sortedIds[0]}-${sortedIds[1]}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `((${recipientColumn}=eq.${user.id} and ${senderColumn}=eq.${contactId}) or (${senderColumn}=eq.${user.id} and ${recipientColumn}=eq.${contactId}))` }, (payload) => {
        $messages.push(payload.new)
        $messages = $messages // update store
      })
      .subscribe()
  })

  afterUpdate(() => { // scroll down
    if ($messages.length) { messagesEl.lastElementChild.scrollIntoView({ behavior: 'smooth' }) }
  })

  onDestroy(() => { if (channel) { supabase.removeChannel(channel) } })

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  async function loadContact () {
    const { data, error } = await supabase.from(profileTable).select('*').eq('id', contactId).single()
    if (error) { return handleError(error) }
    contact = data
  }

  async function loadMessages () {
    // load messages where are both contactId and user.id (sender or recipient columns), sorted by created_at
    const { data, error } = await supabase.from('messages').select('*')
      .or(`and(recipient.eq.${contactId},sender.eq.${user.id}),and(recipient.eq.${user.id},sender.eq.${contactId})`)
      .order('created_at', { ascending: true })

    if (error) { return handleError(error) }
    $messages = data
    markMessagesRead()
  }

  async function markMessagesRead () {
    const myUnreadMessages = $messages.filter(message => message.recipient === user.id && !message.read)
    if (myUnreadMessages.length) {
      const { error } = await supabase.from('messages').update({ read: true }).in('id', myUnreadMessages.map(message => message.id))
      if (error) { return handleError(error) }
    }
  }

  function closeChat () {
    $userStore.openChat = null
  }

  async function sendMessage () {
    // 2DO: Figure out who the sender is, when the user is a character
    const { error } = await supabase.from('messages').insert({ content: textareaValue, [senderColumn]: user.id, [recipientColumn]: contact.id })
    if (error) { return handleError(error) }
    textareaValue = ''
    await loadMessages()
  }

  function getTitle (message) {
    const name = message.sender === user.id ? user.name : contact.name
    const date = new Date(message.created_at)
    return `${name}: ${date.toLocaleDateString('cs')} - ${date.toLocaleTimeString('cs')}`
  }
</script>

{#await waitForAnimation() then}
  <div id='conversation'>
    <button on:click={closeChat} id='close' title='zavřít' class='material'>close</button>
    {#if contactId && user?.id}
      {#await Promise.all([loadContact(), loadMessages()])}
        <span class='loading'>Načítám konverzaci...</span>
      {:then}
        <h2>
          {#if contact.portrait}
            <img src={contact.portrait} class='portrait' alt='portrait'>
          {/if}
          <div class='label'>
            <div class='name'>{contact.name}</div>
            <div class='subtitle'>soukromá konverzace</div>
          </div>
        </h2>

        <div class='messages' bind:this={messagesEl}>
          {#if $messages.length > 0}
            {#each $messages as message}
              <div class='messageRow'>
                <!-- add tippy for time -->
                <div use:tooltip class='message {message.sender === user.id ? 'mine' : 'theirs'}' title={getTitle(message)}>
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
