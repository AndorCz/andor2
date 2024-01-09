<script>
  import { supabase, handleError } from '@lib/database'
  import { beforeUpdate, afterUpdate, onDestroy } from 'svelte'
  import { writable } from 'svelte/store'

  export let user
  export let userStore

  let contact = {}
  let loadingMessages = true
  let messagesEl
  let inputEl
  let channel

  const messages = writable([])
  const contactId = $userStore.openChat
  const sortedIds = [user.id, contactId].sort()

  beforeUpdate(() => {
    // init conversation, listen for new messages in the conversation
    channel = supabase
      .channel(`private-chat-${sortedIds[0]}-${sortedIds[1]}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `((recipient=eq.${user.id} and sender=eq.${contactId}) or (sender=eq.${user.id} and recipient=eq.${contactId}))` }, (payload) => {
        $messages.push(payload.new)
        $messages = $messages // update store
      })
      .subscribe()
    loadMessages().catch(console.error)
  })

  afterUpdate(() => { // scroll down
    if (messages.length) { messagesEl.lastElementChild.scrollIntoView({ behavior: 'smooth' }) }
  })

  onDestroy(() => {
    console.log('destroy fired', channel)
    if (channel) { supabase.removeChannel(channel) }
  })

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  async function loadContact () {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', contactId).single()
    if (error) { return handleError(error) }
    contact = data
  }

  async function loadMessages () {
    // load messages for both uid and user.id, in either sender or recipient column
    const { data, error } = await supabase.from('messages').select('*')
      .or(`sender.eq.${contactId},recipient.eq.${contactId}`)
      .or(`sender.eq.${user.id},recipient.eq.${user.id}`)
      .order('created_at', { ascending: true })
    if (error) { return handleError(error) }
    $messages = data
    loadingMessages = false
  }

  function closeChat () {
    $userStore.openChat = null
  }

  async function sendMessage () {
    const { error } = await supabase.from('messages').insert({ sender: user.id, recipient: contact.id, content: inputEl.value })
    if (error) { return handleError(error) }
    inputEl.value = ''
  }

  function onKeyDown (e) {
    if (event.keyCode === 13 && !e.shiftKey) { // send with enter, new line with shift+enter
      sendMessage()
      e.preventDefault()
    }
  }
</script>

{#await waitForAnimation() then}
  <div id='chat'>
    <button on:click={closeChat} id='close' title='zavřít' class='material'>close</button>
    {#if contactId && user?.id}
      {#await Promise.all([loadContact(), loadMessages()])}
        <span class='loading'>Načítám konverzaci...</span>
      {:then value}
        <h2>
          <img src={contact.portrait} class='portrait' alt='portrait'>
          <div class='label'>
            <div class='name'>{contact.name}</div>
            <div class='subtitle'>soukromá konverzace</div>
          </div>
        </h2>

        <div class='messages' bind:this={messagesEl}>
          {#if loadingMessages}
            <center class='loading'>Načítání...</center>
          {:else if $messages.length > 0}
            {#each $messages as message}
              <div class='messageRow'>
                <!-- add tippy for time -->
                <div class='message {message.sender === user.id ? 'mine' : 'theirs'}' title={(new Date(message.created_at)).toLocaleString('cs')}>
                  <!-- add 'read' column -->
                  {#if !message.read}
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
        <!-- svelte-ignore a11y-autofocus -->
        <textarea type='text' bind:this={inputEl} on:keydown={onKeyDown} maxlength='4096' autofocus></textarea>
        <button class='material send' title='Odeslat' on:click={() => sendMessage()}>send</button>
      {:catch error}
        <span class='error'>Konverzaci se nepodařilo načíst</span>
      {/await}
    {:else}
      <span class='error'>Konverzace nenalezena</span>
    {/if}
  </div>
{/await}

<style>
  #chat {
    position: fixed;
    right: 20px;
    top: 20px;
    background-color: var(--panel);
    border-radius: 10px;
    padding: 20px;
    width: 400px;
    height: 100vh;
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
      flex: 1;
      overflow-y: scroll;
      padding: 5px 20px 10px 20px;
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
          .badge {
            position: absolute;
            top: -5px;
            right: -5px;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            box-shadow: 1px 1px 4px #0005;
            background-color: var(--accent);
          }
          .theirs {
            border-radius: 20px 20px 20px 0px;
            background-color: var(--background);
            text-align: left;
            float: left;
          }
          .mine {
            border-radius: 20px 20px 0px 20px;
            background-color: var(--accent);
            color: var(--gray90);
            text-align: right;
            float: right;
          }
    textarea {
      flex: 0 0 48px;
      display: block;
      width: 85%;
      background-color: var(--gray90);
      overflow: hidden;
      resize: none;
    }
    .send {
      position: absolute;
      bottom: 6px;
      right: 5px;
    }
</style>
