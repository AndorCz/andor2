<script>
  import { activeConversation } from '@lib/stores'
  import { getPortraitUrl } from '@lib/database-browser'
  import GameList from '@components/games/GameList.svelte'
  import SoloList from '@components/solo/SoloList.svelte'
  import WorkList from '@components/works/WorkList.svelte'
  import BoardList from '@components/boards/BoardList.svelte'
  import DOMPurify from 'dompurify'

  const { user = {}, data = {} } = $props()

  const genderLabels = { man: 'Muž', woman: 'Žena', other: 'Jiné' }

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
      {#if data.city}<li>Město: <span class='value'>{data.city}</span></li>{/if}
      {#if data.gender}<li>Pohlaví: <span class='value'>{genderLabels[data.gender] || data.gender}</span></li>{/if}
      <li>Naposledy online: <span class='date'>{new Date(data.last_activity).toLocaleString('cs')}</span></li>
      <li>Datum registrace: <span class='date'>{new Date(data.created_at).toLocaleDateString('cs')}</span></li>
    </ul>
    {#if user.id && user.id !== data.id}
      <button onclick={openConversation}>Napsat zprávu</button>
    {/if}
  </div>
</main>

{#if data.about}
  <section class='about'>
    <h2>O mně</h2>
    <div class='about-content'>{@html DOMPurify.sanitize(data.about, { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })}</div>
  </section>
{/if}

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
      .date, .value {
        font-weight: bold;
        margin-left: 10px;
      }
  .about {
    margin-top: 30px;
  }
  .about-content {
    max-width: 800px;
  }
</style>
