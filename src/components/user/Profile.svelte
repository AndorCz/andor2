<script>
  import { activeConversation } from '@lib/stores'
  import GameList from '@components/games/GameList.svelte'
  import WorkList from '@components/works/WorkList.svelte'
  import BoardList from '@components/boards/BoardList.svelte'

  export let user = {}
  export let data = {}

  function openConversation () {
    $activeConversation = { us: user, them: data, type: 'user' }
  }
</script>

<main>
  <aside>
    {#if data.portrait}
    <img src={data.portrait} alt={data.name} id='portrait' />
  {/if}
  </aside>
  <div class='wide'>
    <h1>{data.name}</h1>
    <p>Uživatel od: {new Date(data.created_at).toLocaleDateString('cs')}</p>
    <button on:click={openConversation}>Napsat zprávu</button>
  </div>
</main>

<h2>Hry</h2>
<GameList {user} games={data.games} />

<h2>Díla</h2>
<WorkList {user} works={data.works} />

<h2>Diskuze</h2>
<BoardList {user} boards={data.boards} />

<style>
  main {
    display: flex;
    align-items: center;
    gap: 40px;
  }
    .wide {
      flex: 1;
    }
    #portrait {
      border-radius: 10px;
    }
</style>
