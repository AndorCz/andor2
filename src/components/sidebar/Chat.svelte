<script>
  import { supabase, handleError } from '@lib/database'

  export let user
  export let userStore

  let contact = {}
  let messages = []

  async function waitForAnimation () {
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  async function loadContact () {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', $userStore.openChat).single()
    if (error) { return handleError(error) }
    contact = data
  }

  async function loadMessages () {
    // load messages for both uid and user.id, in either sender or recipient column
    const { data, error } = await supabase.from('messages').select('*')
      .or(`sender.eq.${$userStore.openChat},recipient.eq.${$userStore.openChat}`)
      .or(`sender.eq.${user.id},recipient.eq.${user.id}`)
      .order('created_at', { ascending: true })
    if (error) { return handleError(error) }
    messages = data
  }

  function closeChat () {
    $userStore.openChat = null
  }
</script>

{#await waitForAnimation() then}
  <div id='chat'>
    <button on:click={closeChat} id='close' title='zavřít' class='material'>close</button>
    {#if $userStore.openChat && user?.id}
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
        <div class='messages'>
          {#if messages.length}
            {#each messages as message}
              <div class='message'>
                <span class='text'>{message.content}</span>
                <span class='time'>{message.created_at}</span>
              </div>
            {/each}
          {:else}
            <span class='empty'>Žádné zprávy</span>
          {/if}
        </div>
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
</style>
