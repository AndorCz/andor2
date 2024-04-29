<script>
  import { activeConversation } from '@lib/stores'
  import { getPortraitUrl } from '@lib/database'
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
  {#if data.portrait}
    <aside>
      <img src={getPortraitUrl(data.id, data.portrait)} class='portrait' alt={data.name} />
    </aside>
  {/if}
  <div class='wide'>
    <h1>{data.name}</h1>
    <ul>
      <li>Naposledy online: <span class='date'>{new Date(data.last_activity).toLocaleString('cs')}</span></li>
      <li>Datum registrace: <span class='date'>{new Date(data.created_at).toLocaleDateString('cs')}</span></li>
    </ul>
    <button on:click={openConversation}>Napsat zprávu</button>
  </div>
</main>

<h2>Hry</h2>
<GameList {user} games={data.games} showTabs={false} />

<h2>Díla</h2>
<WorkList {user} works={data.works} />

<h2>Diskuze</h2>
<BoardList {user} boards={data.boards} />

<style>
  main {
    display: flex;
    align-items: center;
  }
    aside {
      margin-right: 40px;
    }
    .wide {
      flex: 1;
    }
    .portrait {
      border-radius: 10px;
    }
    ul {
      list-style: none;
      padding: 0px;
    }
      li {
        margin: 5px 0px;
      }
      .date {
        font-weight: bold;
        margin-left: 10px;
      }
</style>
