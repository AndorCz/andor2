<script>
  import { activeConversation } from '@lib/stores'
  import { getPortraitUrl } from '@lib/database-browser'
  import GameList from '@components/games/GameList.svelte'
  import SoloList from '@components/solo/SoloList.svelte'
  import WorkList from '@components/works/WorkList.svelte'
  import BoardList from '@components/boards/BoardList.svelte'

  const { user = {}, data = {} } = $props()

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
    <button onclick={openConversation}>Napsat zprávu</button>
  </div>
</main>

<h2>Hry</h2>
<GameList {user} games={data.games} showTabs={false} />

<h2>Sólo koncepty</h2>
<SoloList {user} concepts={data.concepts} showTabs={false} />

<h2>Diskuze</h2>
<BoardList {user} boards={data.boards} />

<h2>Díla</h2>
<WorkList {user} works={data.works} />

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
      max-height: 300px;
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
